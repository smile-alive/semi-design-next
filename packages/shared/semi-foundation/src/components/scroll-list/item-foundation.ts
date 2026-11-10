import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { getListTargetIndex, Typeahead } from '../../utils/a11y';
import { isHTMLElement } from '../../utils/dom';
import { cssClasses, numbers } from './constants';
import animatedScrollTo from './scroll-to';

const msPerFrame = 1000 / 60;
export const wheelMode = 'wheel';

export interface Item {
    [x: string]: any;
    transform?: (value: any, text?: string) => string;
    value: any;
    text?: string;
    disabled?: boolean;
}

export interface ScrollItemBaseProps<I extends Item = Item> {
    cycled?: boolean;
    list?: I[];
    mode?: string;
    motion?: boolean;
    selectedIndex?: number;
    type?: string | number;
}

export interface ScrollItemRow {
    /** Stable while copies are added around the row, so a host keeps the node and the foundation's cached nodes stay valid */
    key: string;
    index: number;
    /** A repeat of the list that only fills the wheel */
    copy: boolean;
}

export interface ScrollItemBaseState {
    prependCount: number;
    appendCount: number;
}

export interface ScrollItemAdapter<I extends Item = Item, P extends ScrollItemBaseProps<I> = ScrollItemBaseProps<I>> extends DefaultAdapter<P, ScrollItemBaseState> {
    /** The listbox element that holds the options, and in a cycled column their copies */
    getListNode: () => HTMLElement | null;
    /** The element that scrolls: the root in normal mode, the outer list in wheel mode */
    getScrollNode: () => HTMLElement | null;
    /** The band that marks the selected row in wheel mode */
    getSelectorNode: () => HTMLElement | null;
    notifySelectItem: (data: I & { type?: string | number; index: number }) => void;
}

export default class ItemFoundation<I extends Item = Item, P extends ScrollItemBaseProps<I> = ScrollItemBaseProps<I>> extends BaseFoundation<ScrollItemAdapter<I, P>, P, ScrollItemBaseState> {
    readonly #typeahead = new Typeahead();
    #cancelScroll: (() => void) | null = null;
    #selectedNode: HTMLElement | null = null;
    #willSelectNode: HTMLElement | null = null;
    #resizeObserver: ResizeObserver | null = null;
    static override readonly propKeys = ['selectedIndex', 'list'];
    // only the list length matters: the sync reads no rows
    static override readonly propEquals = { list: (a?: Item[], b?: Item[]) => a?.length === b?.length };
    readonly #select = debounce((node: HTMLElement) => {
        this.#cacheSelectedNode(node);
        this.#selectNode(node);
    }, msPerFrame * 2);

    get #isCycledWheel() {
        const { cycled, mode } = this.getProps();
        return cycled && mode === wheelMode;
    }

    #cacheSelectedNode(node?: Element | null) {
        if (node) {
            this.#selectedNode = node as HTMLElement;
        }
    }

    #cacheWillSelectNode(node?: Element | null) {
        if (node) {
            this.#willSelectNode = node as HTMLElement;
        }
    }

    #isDisabledIndex(index: number) {
        const { list } = this.getProps();
        return Array.isArray(list) && list.length > 0 && index > -1 && Boolean(list[index % list.length]?.disabled);
    }

    #indexOf(node: Element | null) {
        return Array.from(this.adapter.getListNode().children).indexOf(node);
    }

    // Stays in the copy `refNode` is in, so a cycled column does not jump to another copy. A cycled wheel moves by the
    // shorter way round (11 -> 0 of 12 is one row down, not eleven up), which the copies on both sides make reachable.
    #getNodeByOffset(refNode: HTMLElement | null, offset: number) {
        const { list } = this.getProps();
        const listNode = this.adapter.getListNode();
        if (isHTMLElement(refNode) && isHTMLElement(listNode) && Array.isArray(list) && list.length) {
            const sameCopyStep = offset % list.length;
            if (sameCopyStep) {
                const wrapped = ((offset % list.length) + list.length) % list.length;
                const steps = this.#isCycledWheel ? [wrapped > list.length / 2 ? wrapped - list.length : wrapped, sameCopyStep] : [sameCopyStep];
                for (const step of steps) {
                    let targetIndex = this.#indexOf(refNode) + step;
                    while (targetIndex < 0) {
                        targetIndex += list.length;
                    }
                    const node = listNode.children[targetIndex] as HTMLElement | undefined;
                    if (node) {
                        return node;
                    }
                }
                return undefined;
            }
        }
        return refNode;
    }

    // Known limit: the class is set outside the host's render, so a re-render rewriting className drops it until the
    // next scroll; upgrade by making the highlighted row state.
    #highlightNearestNode() {
        if (this.getProps().mode !== wheelMode) {
            return;
        }
        const listNode = this.adapter.getListNode();
        const node = this.#getNearestNodeInfo().nearestNode || this.#selectedNode;
        if (isHTMLElement(node) && isHTMLElement(listNode)) {
            for (const child of Array.from(listNode.children)) {
                child.classList.remove(cssClasses.SELECTED);
            }
            node.classList.add(cssClasses.SELECTED);
        }
    }

    #stopScroll() {
        this.#cancelScroll?.();
        this.#cancelScroll = null;
    }

    // the items passed during a self-scroll are not selections
    get #isAnimating() {
        return this.#cancelScroll !== null;
    }

    #scrollToPos(targetTop: number, duration: number) {
        const wrapper = this.adapter.getScrollNode();
        // a selection queued by an earlier scroll is stale once the column is moved on purpose
        this.#select.cancel();
        this.#stopScroll();
        if (duration && this.getProps().motion) {
            if (wrapper.scrollTop === targetTop) {
                this.#highlightNearestNode();
            } else {
                this.#cancelScroll = animatedScrollTo(wrapper, targetTop, duration, () => {
                    this.#cancelScroll = null;
                    this.#highlightNearestNode();
                });
            }
        } else {
            wrapper.scrollTop = targetTop;
            this.#highlightNearestNode();
        }
    }

    #scrollToNode(node: HTMLElement | null | undefined, duration: number) {
        if (!node) {
            return;
        }
        const itemHeight = node.offsetHeight || numbers.DEFAULT_ITEM_HEIGHT;
        const targetTop = (node.offsetTop || (this.adapter.getListNode().children.length * itemHeight) / 2) - (this.adapter.getScrollNode().offsetHeight - itemHeight) / 2;
        this.#scrollToPos(targetTop, duration);
    }

    #scrollToCenter(node: HTMLElement) {
        const wrapper = this.adapter.getScrollNode();
        if (isHTMLElement(node) && isHTMLElement(wrapper)) {
            const scrollRect = wrapper.getBoundingClientRect();
            const selectedRect = node.getBoundingClientRect();
            const targetTop = wrapper.scrollTop + (selectedRect.top - (scrollRect.top + scrollRect.height / 2 - selectedRect.height / 2));
            this.#scrollToPos(targetTop, numbers.DEFAULT_SCROLL_DURATION);
        }
    }

    // the node in the list itself, which the copies rendered before it push back
    #getSelectedIndexNode() {
        const { list, selectedIndex } = this.getProps();
        return this.adapter.getListNode().children[this.getState('prependCount') * list.length + (selectedIndex > -1 ? selectedIndex : 0)] as HTMLElement | undefined;
    }

    #recoverSelectedNode() {
        if (this.#selectedNode?.isConnected) {
            return false;
        }
        const node = this.#getSelectedIndexNode();
        this.#cacheSelectedNode(node);
        this.#cacheWillSelectNode(node);
        return Boolean(node);
    }

    // A hidden column has no layout, so this also runs when it shows. The position is absolute: copies added or removed,
    // or a list of another length, leave scrollTop on another row.
    #locateSelected() {
        const locate = () => {
            this.#recoverSelectedNode();
            this.#scrollToNode(this.#selectedNode, 0);
        };
        if (this.#isCycledWheel) {
            this.#renderCopies(locate);
        } else {
            locate();
        }
    }

    #selectNode(node: HTMLElement) {
        const { type, list: data, selectedIndex } = this.getProps();
        const listNode = this.adapter.getListNode();
        if (isHTMLElement(node) && isHTMLElement(listNode)) {
            const indexInList = Array.from(listNode.children).findIndex((ele) => ele === node);
            const indexInData = indexInList % data.length;

            const item = data[indexInData];
            this.#cacheWillSelectNode(node);
            this.#scrollToCenter(node);

            // a scroll ending on the selected item is not a new selection.
            // Known limit: an owner that does not write selectedIndex back is notified again when the centring scroll
            // ends; give the column a controlled selectedIndex.
            if (indexInData !== selectedIndex % data.length) {
                this.adapter.notifySelectItem({
                    ...item,
                    value: item.value,
                    type,
                    index: indexInData,
                });
            }
        }
    }

    // #wrapCycledScroll keeps the row under the selector in the list itself. From there two scroller heights of copies on
    // each side cover half a scroller of rows in view, half a list of the shorter way round, and room to scroll into.
    #renderCopies(callback: () => void) {
        const { list } = this.getProps();
        const rowHeight = this.adapter.getListNode().children[0]?.getBoundingClientRect().height ?? 0;
        const copies = rowHeight > 0 && list.length ? Math.ceil((this.adapter.getScrollNode().getBoundingClientRect().height * 2) / (rowHeight * list.length)) : 0;
        this.setState({ prependCount: copies, appendCount: copies }, callback);
    }

    // The rows repeat, so moving the view by whole copies shows the same rows: scrolling never reaches an end. No <li> is
    // moved, the order stays the one the host rendered. The cached nodes move along, as the next offset counts from them.
    #wrapCycledScroll() {
        const { list } = this.getProps();
        const listNode = this.adapter.getListNode();
        const wrapper = this.adapter.getScrollNode();
        const { children } = listNode;
        const start = this.getState('prependCount') * list.length;
        const first = children[start] as HTMLElement | undefined;
        const next = children[start + list.length] as HTMLElement | undefined;
        const copyHeight = first && next ? next.offsetTop - first.offsetTop : 0;
        if (copyHeight <= 0) {
            return;
        }
        const copies = Math.floor((wrapper.scrollTop + wrapper.offsetHeight / 2 - first.offsetTop) / copyHeight);
        if (copies) {
            const moved = (node: Element | null) => (children[this.#indexOf(node) - copies * list.length] ?? node) as HTMLElement | null;
            wrapper.scrollTop -= copies * copyHeight;
            this.#selectedNode = moved(this.#selectedNode);
            this.#willSelectNode = moved(this.#willSelectNode);
            const highlighted = listNode.querySelector(`.${cssClasses.SELECTED}`);
            if (highlighted) {
                highlighted.classList.remove(cssClasses.SELECTED);
                moved(highlighted).classList.add(cssClasses.SELECTED);
            }
        }
    }

    #getNearestNodeInfo() {
        const listNode = this.adapter.getListNode();
        const selector = this.adapter.getSelectorNode();
        if (isHTMLElement(listNode) && isHTMLElement(selector)) {
            const selectorRect = selector.getBoundingClientRect();
            const selectorTop = selectorRect.top;
            const itemNodes = listNode.querySelectorAll('li');

            let nearestNode: HTMLElement = null;
            let nearestIndex = -1;
            let nearestDistance = Infinity;

            Array.from(itemNodes).map((node, index) => {
                const rect = node.getBoundingClientRect();
                const rectTop = rect.top;
                const absDistance = Math.abs(rectTop - selectorTop);

                if (absDistance < nearestDistance && !this.#isDisabledIndex(index)) {
                    nearestDistance = absDistance;
                    nearestNode = node;
                    nearestIndex = index;
                }
            });

            return { nearestNode, nearestIndex };
        }
        return undefined;
    }

    #getTargetNode(e: Pick<Event, 'target'>) {
        const listNode = this.adapter.getListNode();
        if (e && isHTMLElement(listNode)) {
            const targetTagName = 'li';
            const currentTarget = e.target instanceof Node ? e.target : null;
            const itemNodes = listNode.querySelectorAll(targetTagName);
            const { list } = this.getProps();
            const length = Array.isArray(list) ? list.length : 0;

            let targetIndex = -1;
            let indexInList = -1;
            let infoInList = null;
            const targetNode = Array.from(itemNodes).find((node, index) => {
                if (node === currentTarget || node.contains(currentTarget)) {
                    targetIndex = index;
                    if (length > 0) {
                        indexInList = index % length;
                    }
                    return true;
                }
                return undefined;
            });

            if (indexInList > -1) {
                infoInList = list[indexInList];
            }

            return {
                targetNode,
                targetIndex,
                indexInList,
                infoInList,
            };
        }

        return null;
    }

    #syncList() {
        if (this.#isCycledWheel) {
            this.#locateSelected();
        } else if (this.#recoverSelectedNode()) {
            this.scrollToSelected();
        }
    }

    #syncSelectedIndex(selectedIndex: number, previous: number) {
        if (this.#recoverSelectedNode()) {
            this.scrollToSelected();
            return;
        }
        // Key repeat restarts the self-scroll before it ends, and handleScroll does not wrap during one
        if (this.#isCycledWheel) {
            this.#stopScroll();
            this.#wrapCycledScroll();
        }
        const { list } = this.getProps();
        const willSelectIndex = this.#indexOf(this.#willSelectNode);
        if (!list.length || willSelectIndex % list.length !== selectedIndex % list.length) {
            this.#cacheWillSelectNode(this.#getNodeByOffset(this.#selectedNode, selectedIndex - previous));
        }
        this.#cacheSelectedNode(this.#willSelectNode);
        this.scrollToSelected();
    }

    static getInitialState(): ScrollItemBaseState {
        return { prependCount: 0, appendCount: 0 };
    }

    /**
     * The rows of the listbox in DOM order: the copies of a cycled wheel before the list itself (nearest copy last) and
     * after it. The scroll positioning counts rows by this order, so every host renders exactly these rows.
     */
    static getRows({ list, mode }: Pick<ScrollItemBaseProps, 'list' | 'mode'>, { prependCount, appendCount }: ScrollItemBaseState): ScrollItemRow[] {
        const rows = (name: string) => list.map((_item, index): ScrollItemRow => ({ key: `${name}${index}`, index, copy: name !== '' }));
        if (mode !== wheelMode) {
            return rows('');
        }
        const copies = (count: number, name: string) => Array.from({ length: count }, (_, i) => rows(`${name}_${i}_`));
        return [...copies(prependCount, 'pre').toReversed().flat(), ...rows(''), ...copies(appendCount, 'app').flat()];
    }

    /** Only the selected row is shown through a transform; the item's own transform wins over the column's */
    static getItemText(item: Item, selected: boolean, transform?: Item['transform']) {
        const itemTransform = typeof item.transform === 'function' ? item.transform : transform;
        return selected && typeof itemTransform === 'function' ? itemTransform(item.value, item.text) : (item.text ?? item.value);
    }

    override handlePropsChange(prev: Partial<P>) {
        const { selectedIndex, list } = this.getProps();
        if (prev.selectedIndex !== selectedIndex) {
            this.#syncSelectedIndex(selectedIndex, prev.selectedIndex);
        }
        if (prev.list.length !== list.length) {
            this.#syncList();
        }
    }

    override init() {
        const selectedNode = this.#getSelectedIndexNode();
        this.#cacheSelectedNode(selectedNode);
        this.#cacheWillSelectNode(selectedNode);
        this.#locateSelected();

        const wrapper = this.adapter.getScrollNode();
        let hidden = wrapper.offsetHeight === 0;
        // Only on showing: TimePicker and DatePicker re-centre their columns on a resize, and the user may have scrolled
        this.#resizeObserver = new ResizeObserver(() => {
            const wasHidden = hidden;
            hidden = wrapper.offsetHeight === 0;
            if (wasHidden && !hidden) {
                this.#locateSelected();
            }
        });
        this.#resizeObserver.observe(wrapper);
    }

    override destroy() {
        this.#resizeObserver?.disconnect();
        this.#select.cancel();
        this.#stopScroll();
    }

    /**
     * APG single-select listbox keyboard, selection follows focus; the column scrolls once `selectedIndex` returns
     */
    handleKeyDown = (event: KeyboardEvent) => {
        const { list, selectedIndex, cycled, type } = this.getProps();
        let target = getListTargetIndex(event.key, selectedIndex, list.length, (index) => Boolean(list[index].disabled), {
            loop: cycled,
        });
        if (target === null && this.#typeahead.accepts(event)) {
            const labels = list.map((item: Item) => (item.disabled ? '' : String(item.text ?? item.value)));
            target = this.#typeahead.match(event.key, labels, selectedIndex);
        }
        if (target === null || target === -1) {
            // Space does not select here; unhandled it would page-scroll the wheel and select the item a page away
            if (event.key === ' ') {
                event.preventDefault();
            }
            return;
        }
        event.preventDefault();
        this.#select.cancel();
        if (target !== selectedIndex) {
            this.adapter.notifySelectItem({ ...list[target], type, index: target });
        }
    };

    selectIndex = (index: number) => {
        const { type, list } = this.getProps();
        const listNode = this.adapter.getListNode();
        if (index > -1 && Array.isArray(list) && list.length && isHTMLElement(listNode)) {
            const indexInData = index % list.length;

            const item = list[indexInData];
            this.#cacheWillSelectNode(listNode.children[index]);
            this.#select.cancel();
            this.adapter.notifySelectItem({
                ...item,
                value: item.value,
                type,
                index: indexInData,
            });
        }
    };

    /** Click in a wheel column: the item under the pointer is selected once scrolling settles; an ancestor's click listener does not see it */
    handleWheelClick = (e: Pick<Event, 'target' | 'stopImmediatePropagation'>) => {
        e.stopImmediatePropagation();
        const { targetNode, infoInList } = this.#getTargetNode(e);
        if (targetNode && infoInList && !infoInList.disabled) {
            this.#select(targetNode);
        }
    };

    /** Scroll of the column: in wheel mode the item at the selector is selected once scrolling settles */
    handleScroll = () => {
        // no selector: unmounted before a queued scroll event arrived
        if (this.#isAnimating || !isHTMLElement(this.adapter.getSelectorNode())) {
            return;
        }
        if (this.#isCycledWheel) {
            this.#wrapCycledScroll();
        }
        this.#select(this.#getNearestNodeInfo().nearestNode);
    };

    scrollToSelected = (duration: number = numbers.DEFAULT_SCROLL_DURATION) => {
        this.#scrollToNode(this.#selectedNode, duration);
    };
}
