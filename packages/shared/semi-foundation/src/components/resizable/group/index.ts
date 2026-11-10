import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../../base/foundation';
import { isSecondaryPress } from '../../../utils/pointer';
import { createId } from '../../../utils/uuid';
import type { ResizeStartCallback, ResizeCallback } from '../types';
import { clamp, getItemDirection, getNumberSize } from '../utils';

export interface ResizeGroupOriginalPosition {
    x: number;
    y: number;
    lastItemSize: number;
    nextItemSize: number;
}

export interface ResizeGroupAdapter<P extends ResizeGroupBaseProps = ResizeGroupBaseProps> extends DefaultAdapter<P, ResizeGroupBaseState> {
    getGroupRef: () => HTMLDivElement | null;
}

/**
 * What an item's adapter registers: `min`, `max` and `defaultSize` read the item's current props, and the notify
 * functions report to its callbacks (`notifyResizeStart` returns false to veto the resize).
 */
export interface ResizeGroupItem {
    element: HTMLDivElement;
    min: () => string | undefined;
    max: () => string | undefined;
    defaultSize: () => string | number | undefined;
    notifyResizeStart: ResizeStartCallback;
    notifyResize: ResizeCallback;
    notifyResizeEnd: ResizeCallback;
}

const inDocumentOrder = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

export interface ResizeGroupBaseProps {
    direction?: 'horizontal' | 'vertical';
}

export interface ResizeGroupBaseState {
    isResizing: boolean;
    originalPosition: ResizeGroupOriginalPosition;
    backgroundStyle: { cursor?: string };
    curHandler: number | null;
}

export class ResizeGroupFoundation<P extends ResizeGroupBaseProps = ResizeGroupBaseProps> extends BaseFoundation<ResizeGroupAdapter<P>, P, ResizeGroupBaseState> {
    #itemMinusMap: Map<number, number>;
    #itemPercentMap: Map<number, number>; // percentages avoid float drift
    // false when the first initSpace ran inside display:none. #3336
    #sizeInitialized: boolean = false;
    // Children register before the group initializes, and the registry outlives destroy and init: a hidden subtree
    // unregisters its own children
    #items = new Set<ResizeGroupItem>();
    #handlers = new Set<HTMLDivElement>();
    // an element, not the index in state: a handle may already be detached when it unregisters, and detached nodes have no document order
    #draggingHandler: HTMLDivElement | null = null;
    static override readonly propKeys = ['direction'];

    /** Items and handlers are indexed by DOM order, which a child inserted later would otherwise change */
    #orderedItems() {
        return [...this.#items].sort((a, b) => inDocumentOrder(a.element, b.element));
    }

    #orderedHandlers() {
        return [...this.#handlers].sort(inDocumentOrder);
    }

    get #direction(): 'horizontal' | 'vertical' {
        return this.getProp('direction');
    }

    get #groupRef(): HTMLDivElement | null {
        return this.adapter.getGroupRef();
    }

    get #groupSize() {
        return this.#direction === 'horizontal' ? this.#groupRef.offsetWidth : this.#groupRef.offsetHeight;
    }

    get #window(): Window | null {
        return this.#groupRef?.ownerDocument.defaultView ?? null;
    }

    #clampSlot(item: ResizeGroupItem, index: number, slot: number) {
        const minus = this.#itemMinusMap.get(index);
        return this.#clampItem(item, slot - minus) + minus;
    }

    #toPixels(size: string, parentSize: number) {
        return getNumberSize(size, parentSize, this.#window.innerWidth, this.#window.innerHeight);
    }

    #clampItem(item: ResizeGroupItem, size: number) {
        const groupSize = this.#groupSize;
        return clamp(size, this.#toPixels(item.min() ?? '0%', groupSize), this.#toPixels(item.max() ?? '100%', groupSize));
    }

    #applyDelta(curHandler: number, { lastItemSize, nextItemSize }: ResizeGroupOriginalPosition, delta: number, e: PointerEvent | KeyboardEvent) {
        const direction = this.#direction;
        const items = this.#orderedItems();
        const lastItem = items[curHandler],
            nextItem = items[curHandler + 1];
        let parentSize = this.#groupSize;
        let lastNewSize = lastItemSize + delta;
        let nextNewSize = nextItemSize - delta;

        const lastClamped = this.#clampSlot(lastItem, curHandler, lastNewSize);
        if (lastClamped !== lastNewSize) {
            lastNewSize = lastClamped;
            nextNewSize = lastItemSize + nextItemSize - lastNewSize;
        }
        const nextClamped = this.#clampSlot(nextItem, curHandler + 1, nextNewSize);
        if (nextClamped !== nextNewSize) {
            nextNewSize = nextClamped;
            lastNewSize = lastItemSize + nextItemSize - nextNewSize;
        }

        let lastItemPercent = this.#itemPercentMap.get(curHandler),
            nextItemPercent = this.#itemPercentMap.get(curHandler + 1);

        let lastNewPercent = (lastNewSize / parentSize) * 100;
        let nextNewPercent = lastItemPercent + nextItemPercent - lastNewPercent;
        this.#itemPercentMap.set(curHandler, lastNewPercent);
        this.#itemPercentMap.set(curHandler + 1, nextNewPercent);
        if (direction === 'horizontal') {
            lastItem.element.style.width = `calc(${lastNewPercent}% - ${this.#itemMinusMap.get(curHandler)}px)`;
            nextItem.element.style.width = `calc(${nextNewPercent}% - ${this.#itemMinusMap.get(curHandler + 1)}px)`;
        } else if (direction === 'vertical') {
            lastItem.element.style.height = `calc(${lastNewPercent}% - ${this.#itemMinusMap.get(curHandler)}px)`;
            nextItem.element.style.height = `calc(${nextNewPercent}% - ${this.#itemMinusMap.get(curHandler + 1)}px)`;
        }

        const [lastDir, nextDir] = getItemDirection(direction);
        lastItem.notifyResize({ width: lastItem.element.offsetWidth, height: lastItem.element.offsetHeight }, e, lastDir);
        nextItem.notifyResize({ width: nextItem.element.offsetWidth, height: nextItem.element.offsetHeight }, e, nextDir);
        this.#syncAria();
    }

    #notifyResizeEnd(curHandler: number, e: PointerEvent | KeyboardEvent) {
        const items = this.#orderedItems();
        const lastItem = items[curHandler],
            nextItem = items[curHandler + 1];
        const [lastDir, nextDir] = getItemDirection(this.#direction);
        lastItem.notifyResizeEnd({ width: lastItem.element.offsetWidth, height: lastItem.element.offsetHeight }, e, lastDir);
        nextItem.notifyResizeEnd({ width: nextItem.element.offsetWidth, height: nextItem.element.offsetHeight }, e, nextDir);
    }

    // written to the DOM directly: a drag never re-renders the host
    #syncAria() {
        const parentSize = this.#groupSize;
        if (!parentSize) {
            return;
        }
        const items = this.#orderedItems();
        const handlers = this.#orderedHandlers();
        const percent = (px: number) => (px / parentSize) * 100;
        const limits = (index: number) => {
            const min = items[index].min();
            const max = items[index].max();
            const minus = this.#itemMinusMap.get(index);
            return {
                min: percent((min ? this.#toPixels(min, parentSize) : 0) + minus),
                max: max ? percent(this.#toPixels(max, parentSize) + minus) : 100,
            };
        };
        const round = (value: number) => String(Number(value.toFixed(1)));
        for (let i = 0; i < handlers.length && i + 1 < items.length; i++) {
            const handler = handlers[i];
            const item = items[i].element;
            const last = limits(i);
            const next = limits(i + 1);
            const total = this.#itemPercentMap.get(i) + this.#itemPercentMap.get(i + 1);
            handler.setAttribute('aria-valuenow', round(this.#itemPercentMap.get(i)));
            handler.setAttribute('aria-valuemin', round(Math.max(last.min, total - next.max)));
            handler.setAttribute('aria-valuemax', round(Math.min(last.max, total - next.min)));
            item.id ||= createId('semi-resizable-item');
            handler.setAttribute('aria-controls', item.id);
        }
    }

    #measureHandlerRoom() {
        const horizontal = this.#direction === 'horizontal';
        const handlerSizes = this.#orderedHandlers().map((handler) => (horizontal ? handler.offsetWidth : handler.offsetHeight));
        const itemCount = this.#items.size;
        for (let i = 0; i < itemCount; i++) {
            const before = i > 0 ? handlerSizes[i - 1] / 2 : 0;
            const after = i < itemCount - 1 ? handlerSizes[i] / 2 : 0;
            this.#itemMinusMap.set(i, before + after);
        }
    }

    #initSpace() {
        const direction = this.#direction;

        let parentSize = this.#groupSize;
        // not measurable inside display:none: handleGroupResize re-runs initSpace once visible. #3336
        this.#sizeInitialized = parentSize > 0;
        this.#measureHandlerRoom();

        let totalSizePercent = 0;
        let undefineLoc: Map<number, number> = new Map(),
            undefinedTotal = 0;

        const items = this.#orderedItems();
        for (let i = 0; i < items.length; i++) {
            const child = items[i].element;
            let minSize = items[i].min(),
                maxSize = items[i].max();
            let minSizePercent = minSize ? (this.#toPixels(minSize, parentSize) / parentSize) * 100 : 0,
                maxSizePercent = maxSize ? (this.#toPixels(maxSize, parentSize) / parentSize) * 100 : 100;
            if (minSizePercent > maxSizePercent) {
                console.warn('[Semi ResizableItem]: min size bigger than max size');
            }

            let defaultSize = items[i].defaultSize();
            if (defaultSize) {
                let itemSizePercent: number;
                if (typeof defaultSize === 'string') {
                    if (/^-?\d+(\.\d+)?$/.test(defaultSize)) {
                        undefineLoc.set(i, parseFloat(defaultSize));
                        undefinedTotal += parseFloat(defaultSize);
                        continue;
                    }
                    // a percentage is kept as is, so a 0-sized group (display:none) still gets it
                    itemSizePercent = defaultSize.endsWith('%') ? parseFloat(defaultSize) : (this.#toPixels(defaultSize, parentSize) / parentSize) * 100;
                    this.#itemPercentMap.set(i, itemSizePercent);
                } else if (typeof defaultSize === 'number') {
                    undefineLoc.set(i, defaultSize);
                    undefinedTotal += defaultSize;
                    continue;
                }
                totalSizePercent += itemSizePercent;

                if (direction === 'horizontal') {
                    child.style.width = `calc(${itemSizePercent}% - ${this.#itemMinusMap.get(i)}px)`;
                } else {
                    child.style.height = `calc(${itemSizePercent}% - ${this.#itemMinusMap.get(i)}px)`;
                }

                if (itemSizePercent < minSizePercent) {
                    console.warn('[Semi ResizableGroup]: item size smaller than min size');
                }
                if (itemSizePercent > maxSizePercent) {
                    console.warn('[Semi ResizableGroup]: item size bigger than max size');
                }
            } else {
                undefineLoc.set(i, 1);
                undefinedTotal += 1;
            }
        }
        let undefineSizePercent = 100 - totalSizePercent;
        if (totalSizePercent > 100) {
            console.warn('[Semi ResizableGroup]: total Size bigger than 100%');
            undefineSizePercent = 10; // over 100%: the unsized items split a reserved 10%
        }

        undefineLoc.forEach((value, key) => {
            const child = items[key].element;
            const percent = (value / undefinedTotal) * undefineSizePercent;
            this.#itemPercentMap.set(key, percent);
            if (direction === 'horizontal') {
                child.style.width = `calc(${percent}% - ${this.#itemMinusMap.get(key)}px)`;
            } else {
                child.style.height = `calc(${percent}% - ${this.#itemMinusMap.get(key)}px)`;
            }
        });
        this.#syncAria();
    }

    #measure(handlerIndex: number, x: number, y: number): ResizeGroupOriginalPosition {
        const items = this.#orderedItems();
        const lastItem = items[handlerIndex].element,
            nextItem = items[handlerIndex + 1].element;

        return {
            x,
            y,
            lastItemSize: (this.#direction === 'horizontal' ? lastItem.offsetWidth : lastItem.offsetHeight) + this.#itemMinusMap.get(handlerIndex),
            nextItemSize: (this.#direction === 'horizontal' ? nextItem.offsetWidth : nextItem.offsetHeight) + this.#itemMinusMap.get(handlerIndex + 1),
        };
    }

    #notifyResizeStart(handlerIndex: number, e: PointerEvent | KeyboardEvent) {
        const items = this.#orderedItems();
        const [lastDir, nextDir] = getItemDirection(this.#direction);
        const lastResult = items[handlerIndex].notifyResizeStart(e, lastDir);
        const nextResult = items[handlerIndex + 1].notifyResizeStart(e, nextDir);
        return lastResult !== false && nextResult !== false;
    }

    static getInitialState(): ResizeGroupBaseState {
        return {
            isResizing: false,
            originalPosition: { x: 0, y: 0, lastItemSize: 0, nextItemSize: 0 },
            backgroundStyle: { cursor: 'auto' },
            curHandler: null,
        };
    }

    override init() {
        this.#itemMinusMap = new Map();
        this.#itemPercentMap = new Map();
        this.#initSpace();
    }

    /**
     * Re-runs initSpace the first time the group is measurable (#3336); later resizes must not, or the drag is lost.
     */
    handleGroupResize = () => {
        if (!this.#sizeInitialized && this.#groupSize > 0) {
            this.#initSpace();
        }
    };

    override handlePropsChange() {
        const [stale, current] = this.#direction === 'horizontal' ? ['height', 'width'] : ['width', 'height'];
        this.#measureHandlerRoom();
        this.#orderedItems().forEach(({ element }, i) => {
            element.style.removeProperty(stale);
            element.style[current] = `calc(${this.#itemPercentMap.get(i)}% - ${this.#itemMinusMap.get(i)}px)`;
        });
        this.#syncAria();
    }

    /** Called by an item's adapter once its element is mounted; returns the unregister function */
    registerItem = (item: ResizeGroupItem) => {
        this.#items.add(item);
        return () => {
            this.#items.delete(item);
        };
    };

    /** Called by a handler once its element is mounted; returns the unregister function */
    registerHandler = (handler: HTMLDivElement) => {
        this.#handlers.add(handler);
        return () => {
            // lostpointercapture of a removed handle goes to the document, so its drag would never end
            if (handler === this.#draggingHandler) {
                this.#draggingHandler = null;
                this.setState({ isResizing: false, curHandler: null });
            }
            this.#handlers.delete(handler);
        };
    };

    /**
     * Keyboard resize, reported like a drag: arrows move 1% of the group (Shift: 10%), Home and End go to the
     * limits. Returns whether the key was handled.
     */
    resizeByKey = (handler: HTMLDivElement, e: KeyboardEvent) => {
        // a handler that left the group (unmounted mid-drag) still reaches here from its detached element
        const handlerIndex = this.#orderedHandlers().indexOf(handler);
        // Alt/Ctrl/Meta plus an arrow is a browser or OS shortcut
        if (handlerIndex < 0 || e.altKey || e.ctrlKey || e.metaKey) {
            return false;
        }
        const [backKey, forwardKey] = this.#direction === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
        const groupSize = this.#groupSize;
        const step = (groupSize * (e.shiftKey ? 10 : 1)) / 100;
        const delta = new Map([
            [backKey, -step],
            [forwardKey, step],
            ['Home', -groupSize],
            ['End', groupSize],
        ]).get(e.key);
        if (delta === undefined) {
            return false;
        }
        if (this.#notifyResizeStart(handlerIndex, e)) {
            this.#applyDelta(handlerIndex, this.#measure(handlerIndex, 0, 0), delta, e);
            this.#notifyResizeEnd(handlerIndex, e);
        }
        return true;
    };

    onResizeStart = (handler: HTMLDivElement, e: PointerEvent) => {
        const handlerIndex = this.#orderedHandlers().indexOf(handler);
        if (handlerIndex < 0 || isSecondaryPress(e) || !this.#notifyResizeStart(handlerIndex, e)) {
            return;
        }
        const states = this.getStates();
        this.#draggingHandler = handler;
        this.setState({
            isResizing: true,
            originalPosition: this.#measure(handlerIndex, e.clientX, e.clientY),
            backgroundStyle: {
                ...states.backgroundStyle,
                // the target is the handle; instanceof against the global Element fails when the group lives in an iframe
                cursor: this.#window.getComputedStyle(e.target as Element).cursor || 'auto',
            },
            curHandler: handlerIndex,
        });
    };

    onResizing = (handler: HTMLDivElement, e: PointerEvent) => {
        const state = this.getStates();
        if (!state.isResizing || !this.#handlers.has(handler)) {
            return;
        }
        const { curHandler, originalPosition } = state;
        const delta = this.#direction === 'horizontal' ? e.clientX - originalPosition.x : e.clientY - originalPosition.y;
        this.#applyDelta(curHandler, originalPosition, delta, e);
    };

    onResizeEnd = (handler: HTMLDivElement, e: PointerEvent) => {
        const { isResizing, curHandler } = this.getStates();
        if (!isResizing || !this.#handlers.has(handler)) {
            return;
        }
        this.#notifyResizeEnd(curHandler, e);
        this.#draggingHandler = null;
        this.setState({
            isResizing: false,
            curHandler: null,
        });
    };

    ensureConstraint = debounce(() => {
        // a hidden group measures 0, and percentages computed against it are Infinity
        if (!this.#groupSize) {
            return;
        }
        const direction = this.#direction;
        const items = this.#orderedItems();
        const itemCount = items.length;
        let continueFlag = true;
        for (let i = 0; i < itemCount; i++) {
            const child = items[i].element;
            const childSize = direction === 'horizontal' ? child.offsetWidth : child.offsetHeight;
            const childNewSize = this.#clampItem(items[i], childSize);
            if (childNewSize !== childSize) {
                // the difference goes to the nearest item within its limits: later items first, then earlier ones
                const donors = [...Array.from({ length: itemCount - i - 1 }, (_, k) => i + 1 + k), ...Array.from({ length: i }, (_, k) => i - 1 - k)];
                const j = donors.find((index) => {
                    const item = items[index].element;
                    const itemSize = direction === 'horizontal' ? item.offsetWidth : item.offsetHeight;
                    return this.#clampItem(items[index], itemSize) === itemSize;
                });
                if (j === undefined) {
                    continueFlag = false;
                    console.warn('[Semi ResizableGroup]: no enough space to adjust min/max size');
                } else {
                    const item = items[j].element;
                    const childPercent = this.#itemPercentMap.get(i);
                    const itemPercent = this.#itemPercentMap.get(j);
                    const childNewPercent = ((childNewSize + this.#itemMinusMap.get(i)) / this.#groupSize) * 100;
                    const itemNewPercent = childPercent + itemPercent - childNewPercent;
                    this.#itemPercentMap.set(i, childNewPercent);
                    this.#itemPercentMap.set(j, itemNewPercent);
                    if (direction === 'horizontal') {
                        child.style.width = `calc(${childNewPercent}% - ${this.#itemMinusMap.get(i)}px)`;
                        item.style.width = `calc(${itemNewPercent}% - ${this.#itemMinusMap.get(j)}px)`;
                    } else {
                        child.style.height = `calc(${childNewPercent}% - ${this.#itemMinusMap.get(i)}px)`;
                        item.style.height = `calc(${itemNewPercent}% - ${this.#itemMinusMap.get(j)}px)`;
                    }
                }
            }
            if (!continueFlag) {
                break;
            }
        }
        this.#syncAria();
    }, 200);

    override destroy() {
        // a debounced call would otherwise touch items that are gone
        this.ensureConstraint.cancel();
    }
}
