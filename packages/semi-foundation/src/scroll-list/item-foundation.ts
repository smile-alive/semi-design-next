import { debounce, throttle } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { getListTargetIndex, Typeahead } from '../utils/a11y';
import isElement from '../utils/is-element';
import { cssClasses, numbers } from './constants';
import animatedScrollTo from './scroll-to';

const msPerFrame = 1000 / 60;
const wheelMode = 'wheel';

export interface Item {
    [x: string]: any;
    transform?: (value: any, text?: string) => string;
    value: any;
    text?: string;
    disabled?: boolean;
}

/** The props the foundation reads with getProp */
export interface ScrollItemBaseProps<I extends Item = Item> {
    cycled?: boolean;
    list?: I[];
    mode?: string;
    motion?: boolean;
    selectedIndex?: number;
    type?: string | number;
}

export interface ScrollItemBaseState {
    prependCount: number;
    appendCount: number;
}

export interface ScrollItemAdapter<I extends Item = Item, P extends ScrollItemBaseProps<I> = ScrollItemBaseProps<I>, S extends ScrollItemBaseState = ScrollItemBaseState> extends DefaultAdapter<P, S> {
    /** The listbox element that holds the options, and in a cycled column their copies */
    getListNode: () => HTMLElement | null;
    /** The element that scrolls: the root in normal mode, the outer list in wheel mode */
    getScrollNode: () => HTMLElement | null;
    /** The band that marks the selected row in wheel mode */
    getSelectorNode: () => HTMLElement | null;
    notifySelectItem: (data: I & { type?: string | number; index: number }) => void;
}

export default class ItemFoundation<I extends Item = Item, P extends ScrollItemBaseProps<I> = ScrollItemBaseProps<I>, S extends ScrollItemBaseState = ScrollItemBaseState> extends BaseFoundation<ScrollItemAdapter<I, P, S>, P, S> {
    readonly #typeahead = new Typeahead();
    #cancelScroll: (() => void) | null = null;
    #selectedNode: HTMLElement | null = null;
    #willSelectNode: HTMLElement | null = null;
    readonly #select = debounce((node: HTMLElement) => {
        this.#cacheSelectedNode(node);
        this.#selectNode(node);
    }, msPerFrame * 2);
    readonly #adjustList = throttle(() => this.#adjustInfiniteList(), msPerFrame);

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
        return Array.from(this._adapter.getListNode().children).indexOf(node);
    }

    // Stays in the copy `refNode` is in, so a cycled column does not jump to another copy. A cycled wheel moves by the
    // shorter way round (11 -> 0 of 12 is one row down, not eleven up), which the copies on both sides make reachable.
    #getNodeByOffset(refNode: HTMLElement | null, offset: number) {
        const { list, cycled, mode } = this.getProps();
        const listNode = this._adapter.getListNode();
        if (isElement(refNode) && isElement(listNode) && Array.isArray(list) && list.length) {
            const sameCopyStep = offset % list.length;
            if (sameCopyStep) {
                const wrapped = ((offset % list.length) + list.length) % list.length;
                const steps = cycled && mode === wheelMode ? [wrapped > list.length / 2 ? wrapped - list.length : wrapped, sameCopyStep] : [sameCopyStep];
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
    // next scroll; upgrade with the infinite list rewrite, when the highlighted index can be state.
    #highlightNearestNode() {
        if (this.getProps().mode !== wheelMode) {
            return;
        }
        const listNode = this._adapter.getListNode();
        const node = this.#getNearestNodeInfo().nearestNode || this.#selectedNode;
        if (isElement(node) && isElement(listNode)) {
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
        const wrapper = this._adapter.getScrollNode();
        // a selection queued by an earlier scroll is stale once the column is moved on purpose
        this.#select.cancel();
        if (duration && this.getProps().motion) {
            this.#stopScroll();
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
        const targetTop = (node.offsetTop || (this._adapter.getListNode().children.length * itemHeight) / 2) - (this._adapter.getScrollNode().offsetHeight - itemHeight) / 2;
        this.#scrollToPos(targetTop, duration);
    }

    #scrollToCenter(node: HTMLElement) {
        const wrapper = this._adapter.getScrollNode();
        if (isElement(node) && isElement(wrapper)) {
            const scrollRect = wrapper.getBoundingClientRect();
            const selectedRect = node.getBoundingClientRect();
            const targetTop = wrapper.scrollTop + (selectedRect.top - (scrollRect.top + scrollRect.height / 2 - selectedRect.height / 2));
            this.#scrollToPos(targetTop, numbers.DEFAULT_SCROLL_DURATION);
        }
    }

    // cycled wheel columns are skipped: their copies shift the index and are rearranged outside the host
    #recoverSelectedNode() {
        const { cycled, mode, selectedIndex } = this.getProps();
        if ((cycled && mode === wheelMode) || this.#selectedNode?.isConnected) {
            return false;
        }
        const node = this._adapter.getListNode().children[selectedIndex > -1 ? selectedIndex : 0] as HTMLElement | undefined;
        this.#cacheSelectedNode(node);
        this.#cacheWillSelectNode(node);
        return Boolean(node);
    }

    #selectNode(node: HTMLElement) {
        const { type, list: data, selectedIndex } = this.getProps();
        const listNode = this._adapter.getListNode();
        if (isElement(node) && isElement(listNode)) {
            const indexInList = Array.from(listNode.children).findIndex((ele) => ele === node);
            const indexInData = indexInList % data.length;

            const item = data[indexInData];
            this.#cacheWillSelectNode(node);
            this.#scrollToCenter(node);

            // a scroll ending on the selected item is not a new selection.
            // Known limit: an owner that does not write selectedIndex back is notified again when the centring scroll
            // ends; give the column a controlled selectedIndex.
            if (indexInData !== selectedIndex % data.length) {
                this._adapter.notifySelectItem({
                    ...item,
                    value: item.value,
                    type,
                    index: indexInData,
                });
            }
        }
    }

    #initWheelList(callback: () => void) {
        const { list } = this.getProps();
        const listNode = this._adapter.getListNode();
        const wrapper = this._adapter.getScrollNode();
        if (isElement(wrapper) && isElement(listNode) && list && list.length) {
            const prependCount = this.shouldPrepend(listNode, wrapper);
            const appendCount = this.shouldAppend(listNode, wrapper);

            this.setState({ prependCount, appendCount }, callback);
        }
    }

    #adjustInfiniteList() {
        const { list } = this.getProps();
        const listNode = this._adapter.getListNode();
        const wrapper = this._adapter.getScrollNode();
        const nodeTag = 'li';
        if (isElement(wrapper) && isElement(listNode) && list && list.length) {
            const allNodes = listNode.querySelectorAll(nodeTag);
            const total = allNodes.length;
            const ratio = 1;

            const prependCount = this.shouldPrepend(listNode, wrapper, ratio);
            const appendCount = this.shouldAppend(listNode, wrapper, ratio);

            if (prependCount) {
                // move last nodes to first position
                for (let i = 0; i < prependCount; i++) {
                    const nodes = Array.from(allNodes).slice(total - list.length * (i + 1), total - list.length * i);
                    listNode.prepend(...nodes);
                }
            }

            if (appendCount) {
                for (let i = 0; i < appendCount; i++) {
                    const nodes = Array.from(allNodes).slice(i * list.length, (i + 1) * list.length);
                    listNode.append(...nodes);
                }
            }
        }
    }

    #getNearestNodeInfo() {
        const listNode = this._adapter.getListNode();
        const selector = this._adapter.getSelectorNode();
        if (isElement(listNode) && isElement(selector)) {
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
        const listNode = this._adapter.getListNode();
        if (e && isElement(listNode)) {
            const targetTagName = 'li';
            const currentTarget = e.target as Node | null;
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

    protected shouldAppend(listWrapper: HTMLElement, scrollWrapper: HTMLElement, ratio = 2) {
        const tag = 'li';
        if (isElement(listWrapper) && isElement(scrollWrapper)) {
            const itemNodes = listWrapper.querySelectorAll(tag);
            const lastNode = itemNodes[itemNodes.length - 1];
            const { list } = this.getProps();

            if (lastNode) {
                const scrollRect = scrollWrapper.getBoundingClientRect();
                const lastRect = lastNode.getBoundingClientRect();

                const listHeight = lastRect.height * list.length;
                // without layout (jsdom) `baseTop += listHeight` never advances and the loop would not end
                if (listHeight <= 0) {
                    return 0;
                }
                let baseTop = lastRect.top;
                let count = 0;

                while (baseTop <= scrollRect.top + scrollRect.height * ratio) {
                    count += 1;
                    baseTop += listHeight;
                }

                return count;
            }
        }

        return 0;
    }

    protected shouldPrepend(listWrapper: HTMLElement, scrollWrapper: HTMLElement, ratio = 2) {
        const tag = 'li';

        if (isElement(listWrapper) && isElement(scrollWrapper)) {
            const itemNodes = listWrapper.querySelectorAll(tag);
            const firstNode = itemNodes[0];
            const { list } = this.getProps();

            if (firstNode) {
                const scrollRect = scrollWrapper.getBoundingClientRect();
                const firstRect = firstNode.getBoundingClientRect();

                const listHeight = firstRect.height * list.length;
                // without layout (jsdom) `baseTop -= listHeight` never advances and the loop would not end
                if (listHeight <= 0) {
                    return 0;
                }

                let baseTop = firstRect.top;
                let count = 0;

                while (baseTop + firstRect.height >= scrollRect.top - scrollRect.height * ratio) {
                    count += 1;
                    baseTop -= listHeight;
                }

                return count;
            }
        }

        return 0;
    }

    override init() {
        const { mode, cycled, selectedIndex } = this.getProps();
        const selectedNode = this._adapter.getListNode().children[typeof selectedIndex === 'number' && selectedIndex > -1 ? selectedIndex : 0] as HTMLElement | undefined;
        this.#cacheSelectedNode(selectedNode);
        this.#cacheWillSelectNode(selectedNode);
        if (mode === wheelMode && cycled) {
            this.#initWheelList(() => this.#scrollToNode(selectedNode, 0));
        } else {
            this.#scrollToNode(selectedNode, 0);
        }
    }

    override destroy() {
        this.#select.cancel();
        this.#adjustList.cancel();
        this.#stopScroll();
    }

    /**
     * APG single-select listbox keyboard, selection follows focus; the column scrolls once `selectedIndex` returns
     */
    handleKeyDown(event: KeyboardEvent) {
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
            this._adapter.notifySelectItem({ ...list[target], type, index: target });
        }
    }

    /** Click on an item in normal mode */
    selectIndex(index: number) {
        const { type, list } = this.getProps();
        const listNode = this._adapter.getListNode();
        if (index > -1 && Array.isArray(list) && list.length && isElement(listNode)) {
            const indexInData = index % list.length;

            const item = list[indexInData];
            this.#cacheWillSelectNode(listNode.children[index]);
            this.#select.cancel();
            this._adapter.notifySelectItem({
                ...item,
                value: item.value,
                type,
                index: indexInData,
            });
        }
    }

    /** Click in a wheel column: the item under the pointer is selected once scrolling settles */
    handleWheelClick(e: Pick<Event, 'target'>) {
        const { targetNode, infoInList } = this.#getTargetNode(e);
        if (targetNode && infoInList && !infoInList.disabled) {
            this.#select(targetNode);
        }
    }

    /** Scroll of the column: in wheel mode the item at the selector is selected once scrolling settles */
    handleScroll() {
        const info = this.#getNearestNodeInfo();
        // unmounted before a queued scroll event arrived
        if (!info) {
            return;
        }
        if (this.getProps().cycled) {
            this.#adjustList();
        }
        if (!this.#isAnimating) {
            this.#select(info.nearestNode);
        }
    }

    /** The list length changed */
    syncList() {
        if (this.#recoverSelectedNode()) {
            this.scrollToSelected();
        }
    }

    /** The owner changed `selectedIndex` */
    syncSelectedIndex(selectedIndex: number, previous: number) {
        if (this.#recoverSelectedNode()) {
            this.scrollToSelected();
            return;
        }
        const { list } = this.getProps();
        const willSelectIndex = this.#indexOf(this.#willSelectNode);
        if (!list.length || willSelectIndex % list.length !== selectedIndex % list.length) {
            this.#cacheWillSelectNode(this.#getNodeByOffset(this.#selectedNode, selectedIndex - previous));
        }
        this.#cacheSelectedNode(this.#willSelectNode);
        this.scrollToSelected();
    }

    /** Centres the item last selected */
    scrollToSelected(duration: number = numbers.DEFAULT_SCROLL_DURATION) {
        this.#scrollToNode(this.#selectedNode, duration);
    }
}
