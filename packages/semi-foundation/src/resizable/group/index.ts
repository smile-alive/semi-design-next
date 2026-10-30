import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { isSecondaryPress } from '../../utils/pointer';
import { createId } from '../../utils/uuid';
import type { ResizeStartCallback, ResizeCallback } from '../types';
import { clamp, getItemDirection, getNumberSize } from '../utils';

export interface ResizeGroupOriginalPosition {
    x: number;
    y: number;
    lastItemSize: number;
    nextItemSize: number;
}

export interface ResizeGroupAdapter<P extends ResizeGroupBaseProps = ResizeGroupBaseProps, S extends ResizeGroupBaseState = ResizeGroupBaseState> extends DefaultAdapter<P, S> {
    getGroupRef: () => HTMLDivElement | null;
    getItem: (index: number) => HTMLDivElement;
    getItemCount: () => number;
    getHandler: (index: number) => HTMLDivElement;
    getHandlerCount: () => number;
    getItemMin: (index: number) => string | undefined;
    getItemMax: (index: number) => string | undefined;
    getItemStart: (index: number) => ResizeStartCallback | undefined;
    getItemChange: (index: number) => ResizeCallback | undefined;
    getItemEnd: (index: number) => ResizeCallback | undefined;
    getItemDefaultSize: (index: number) => string | number | undefined;
}

/** The props the foundation reads with getProp */
export interface ResizeGroupBaseProps {
    direction?: 'horizontal' | 'vertical';
}

export interface ResizeGroupBaseState {
    isResizing: boolean;
    originalPosition: ResizeGroupOriginalPosition;
    backgroundStyle: { cursor?: string };
    curHandler: number | null;
}

export class ResizeGroupFoundation<P extends ResizeGroupBaseProps = ResizeGroupBaseProps, S extends ResizeGroupBaseState = ResizeGroupBaseState> extends BaseFoundation<ResizeGroupAdapter<P, S>, P, S> {
    #itemMinusMap: Map<number, number>;
    #itemPercentMap: Map<number, number>; // percentages avoid float drift
    // false when the first initSpace ran inside display:none. #3336
    #sizeInitialized: boolean = false;

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

    #clampSlot(index: number, slot: number) {
        const minus = this.#itemMinusMap.get(index);
        return this.#clampItem(index, slot - minus) + minus;
    }

    #toPixels(size: string, parentSize: number) {
        return getNumberSize(size, parentSize, this.#window.innerWidth, this.#window.innerHeight);
    }

    #clampItem(index: number, size: number) {
        const groupSize = this.#groupSize;
        return clamp(size, this.#toPixels(this.adapter.getItemMin(index) ?? '0%', groupSize), this.#toPixels(this.adapter.getItemMax(index) ?? '100%', groupSize));
    }

    #applyDelta(curHandler: number, { lastItemSize, nextItemSize }: ResizeGroupOriginalPosition, delta: number, e: PointerEvent | KeyboardEvent) {
        const direction = this.#direction;
        let lastItem = this.adapter.getItem(curHandler),
            nextItem = this.adapter.getItem(curHandler + 1);
        let parentSize = this.#groupSize;
        let lastNewSize = lastItemSize + delta;
        let nextNewSize = nextItemSize - delta;

        const lastClamped = this.#clampSlot(curHandler, lastNewSize);
        if (lastClamped !== lastNewSize) {
            lastNewSize = lastClamped;
            nextNewSize = lastItemSize + nextItemSize - lastNewSize;
        }
        const nextClamped = this.#clampSlot(curHandler + 1, nextNewSize);
        if (nextClamped !== nextNewSize) {
            nextNewSize = nextClamped;
            lastNewSize = lastItemSize + nextItemSize - nextNewSize;
        }

        let lastItemPercent = this.#itemPercentMap.get(curHandler),
            nextItemPercent = this.#itemPercentMap.get(curHandler + 1);

        let lastNewPercent = (lastNewSize / parentSize) * 100;
        let nextNewPercent = lastItemPercent + nextItemPercent - lastNewPercent; // no float drift
        this.#itemPercentMap.set(curHandler, lastNewPercent);
        this.#itemPercentMap.set(curHandler + 1, nextNewPercent);
        if (direction === 'horizontal') {
            lastItem.style.width = `calc(${lastNewPercent}% - ${this.#itemMinusMap.get(curHandler)}px)`;
            nextItem.style.width = `calc(${nextNewPercent}% - ${this.#itemMinusMap.get(curHandler + 1)}px)`;
        } else if (direction === 'vertical') {
            lastItem.style.height = `calc(${lastNewPercent}% - ${this.#itemMinusMap.get(curHandler)}px)`;
            nextItem.style.height = `calc(${nextNewPercent}% - ${this.#itemMinusMap.get(curHandler + 1)}px)`;
        }

        let lastFunc = this.adapter.getItemChange(curHandler),
            nextFunc = this.adapter.getItemChange(curHandler + 1);
        let [lastDir, nextDir] = getItemDirection(direction);
        if (lastFunc) {
            lastFunc({ width: lastItem.offsetWidth, height: lastItem.offsetHeight }, e, lastDir);
        }
        if (nextFunc) {
            nextFunc({ width: nextItem.offsetWidth, height: nextItem.offsetHeight }, e, nextDir);
        }
        this.#syncAria();
    }

    #notifyResizeEnd(curHandler: number, e: PointerEvent | KeyboardEvent) {
        let lastItem = this.adapter.getItem(curHandler),
            nextItem = this.adapter.getItem(curHandler + 1);
        let lastFunc = this.adapter.getItemEnd(curHandler),
            nextFunc = this.adapter.getItemEnd(curHandler + 1);
        let [lastDir, nextDir] = getItemDirection(this.#direction);
        if (lastFunc) {
            lastFunc({ width: lastItem.offsetWidth, height: lastItem.offsetHeight }, e, lastDir);
        }
        if (nextFunc) {
            nextFunc({ width: nextItem.offsetWidth, height: nextItem.offsetHeight }, e, nextDir);
        }
    }

    // written to the DOM directly: a drag never re-renders the host
    #syncAria() {
        const parentSize = this.#groupSize;
        if (!parentSize) {
            return;
        }
        const percent = (px: number) => (px / parentSize) * 100;
        const limits = (index: number) => {
            const min = this.adapter.getItemMin(index);
            const max = this.adapter.getItemMax(index);
            const minus = this.#itemMinusMap.get(index);
            return {
                min: percent((min ? this.#toPixels(min, parentSize) : 0) + minus),
                max: max ? percent(this.#toPixels(max, parentSize) + minus) : 100,
            };
        };
        const round = (value: number) => String(Number(value.toFixed(1)));
        for (let i = 0; i < this.adapter.getHandlerCount() && i + 1 < this.adapter.getItemCount(); i++) {
            const handler = this.adapter.getHandler(i);
            const item = this.adapter.getItem(i);
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
        const handlerSizes = Array.from({ length: this.adapter.getHandlerCount() }, (_, i) => {
            const handler = this.adapter.getHandler(i);
            return horizontal ? handler.offsetWidth : handler.offsetHeight;
        });
        const itemCount = this.adapter.getItemCount();
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

        for (let i = 0; i < this.adapter.getItemCount(); i++) {
            const child = this.adapter.getItem(i);
            let minSize = this.adapter.getItemMin(i),
                maxSize = this.adapter.getItemMax(i);
            let minSizePercent = minSize ? (this.#toPixels(minSize, parentSize) / parentSize) * 100 : 0,
                maxSizePercent = maxSize ? (this.#toPixels(maxSize, parentSize) / parentSize) * 100 : 100;
            if (minSizePercent > maxSizePercent) {
                console.warn('[Semi ResizableItem]: min size bigger than max size');
            }

            let defaultSize = this.adapter.getItemDefaultSize(i);
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
            const child = this.adapter.getItem(key);
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
        let lastItem = this.adapter.getItem(handlerIndex),
            nextItem = this.adapter.getItem(handlerIndex + 1);

        return {
            x,
            y,
            lastItemSize: (this.#direction === 'horizontal' ? lastItem.offsetWidth : lastItem.offsetHeight) + this.#itemMinusMap.get(handlerIndex),
            nextItemSize: (this.#direction === 'horizontal' ? nextItem.offsetWidth : nextItem.offsetHeight) + this.#itemMinusMap.get(handlerIndex + 1),
        };
    }

    /** Returns false when either item's onResizeStart returned false */
    #notifyResizeStart(handlerIndex: number, e: PointerEvent | KeyboardEvent) {
        const [lastDir, nextDir] = getItemDirection(this.#direction);
        const lastResult = this.adapter.getItemStart(handlerIndex)?.(e, lastDir);
        const nextResult = this.adapter.getItemStart(handlerIndex + 1)?.(e, nextDir);
        return lastResult !== false && nextResult !== false;
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

    /**
     * Moves each item's inline size to the new axis, where the handlers take a different length
     */
    handleDirectionChange = () => {
        const [stale, current] = this.#direction === 'horizontal' ? ['height', 'width'] : ['width', 'height'];
        this.#measureHandlerRoom();
        for (let i = 0; i < this.adapter.getItemCount(); i++) {
            const item = this.adapter.getItem(i);
            item.style.removeProperty(stale);
            item.style[current] = `calc(${this.#itemPercentMap.get(i)}% - ${this.#itemMinusMap.get(i)}px)`;
        }
        this.#syncAria();
    };

    /**
     * Keyboard resize, reported like a drag: arrows move 1% of the group (Shift: 10%), Home and End go to the
     * limits. Returns whether the key was handled.
     */
    resizeByKey = (handlerIndex: number, e: KeyboardEvent) => {
        // Alt/Ctrl/Meta plus an arrow is a browser or OS shortcut
        if (e.altKey || e.ctrlKey || e.metaKey) {
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

    onResizeStart = (handlerIndex: number, e: PointerEvent) => {
        if (isSecondaryPress(e) || !this.#notifyResizeStart(handlerIndex, e)) {
            return;
        }
        const states = this.getStates();
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

    onResizing = (e: PointerEvent) => {
        const state = this.getStates();
        if (!state.isResizing) {
            return;
        }
        const { curHandler, originalPosition } = state;
        const delta = this.#direction === 'horizontal' ? e.clientX - originalPosition.x : e.clientY - originalPosition.y;
        this.#applyDelta(curHandler, originalPosition, delta, e);
    };

    onResizeEnd = (e: PointerEvent) => {
        const { isResizing, curHandler } = this.getStates();
        if (!isResizing) {
            return;
        }
        this.#notifyResizeEnd(curHandler, e);
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
        const itemCount = this.adapter.getItemCount();
        let continueFlag = true;
        for (let i = 0; i < itemCount; i++) {
            const child = this.adapter.getItem(i);
            const childSize = direction === 'horizontal' ? child.offsetWidth : child.offsetHeight;
            const childNewSize = this.#clampItem(i, childSize);
            if (childNewSize !== childSize) {
                // the difference goes to the nearest item within its limits: later items first, then earlier ones
                const donors = [...Array.from({ length: itemCount - i - 1 }, (_, k) => i + 1 + k), ...Array.from({ length: i }, (_, k) => i - 1 - k)];
                const j = donors.find((index) => {
                    const item = this.adapter.getItem(index);
                    const itemSize = direction === 'horizontal' ? item.offsetWidth : item.offsetHeight;
                    return this.#clampItem(index, itemSize) === itemSize;
                });
                if (j === undefined) {
                    continueFlag = false;
                    console.warn('[Semi ResizableGroup]: no enough space to adjust min/max size');
                } else {
                    const item = this.adapter.getItem(j);
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
