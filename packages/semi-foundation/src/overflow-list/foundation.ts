import { isEqual } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { numbers, strings } from './constants';

const Boundary = strings.BOUNDARY_MAP;
const RenderMode = strings.MODE_MAP;

export type ItemKey = string | number;
export type ItemKeyOption = ItemKey | ((item: Record<string, any>) => ItemKey);
/** Scroll mode's overflow: the items hidden before and after the visible ones */
export type ScrollOverflow = [Array<Record<string, any>>, Array<Record<string, any>>];

/**
 * What the host renders: reset whenever items or style change, kept apart from the state so the reset reaches the
 * DOM in the same commit as the props
 */
export interface OverflowListView {
    items: Array<Record<string, any>>;
    style?: object;
    /** The item keys of the reset: a new itemKey drops the widths kept by the old keys */
    keys?: ItemKey[];
    visible: Array<Record<string, any>>;
    overflow: Array<Record<string, any>>;
    /** Collapse mode: the number of items the last measurement kept visible, -1 before any */
    pivot: number;
    maxCount: number;
    overflowStatus: 'calculating' | 'overflowed' | 'normal';
    // cache that keeps the arrow/menu state stable while items change or before the IntersectionObserver reports
    scrollOverflow: ScrollOverflow;
}

export interface OverflowListAdapter<P extends OverflowListBaseProps = OverflowListBaseProps, S extends OverflowListBaseState = OverflowListBaseState> extends DefaultAdapter<P, S> {
    updateView: (view: Partial<OverflowListView>) => void;
    updateVisibleState: (visible: Map<string, boolean>) => void;
    notifyIntersect: (res: Record<string, IntersectionObserverEntry>) => void;
    notifyOverflow: (overflow: Array<Record<string, any>>) => void;
}

/** `items` index of the first visible item, the direction of the rest and the collapseFrom it was laid out for */
export interface VisibleLayout {
    first: number;
    step: 1 | -1;
    fromStart: boolean;
}

/** The props the foundation reads */
export interface OverflowListBaseProps {
    collapseFrom?: 'start' | 'end';
    items?: Array<Record<string, any>>;
    itemKey?: ItemKeyOption;
    minVisibleItems?: number;
    renderMode?: 'collapse' | 'scroll';
    style?: object;
}

export interface OverflowListBaseState {
    containerWidth: number;
    overflowWidth: number;
    visibleState: Map<string, boolean>;
}

/** The items hidden before and after the visible run; null when no item is visible, which is no reliable result */
function computeScrollOverflow(items: Array<Record<string, any>>, itemKey: ItemKeyOption, visibleState: Map<string, boolean>): ScrollOverflow | null {
    const visibleStateArr = items.map((item, idx) => Boolean(visibleState.get(String(OverflowListFoundation.getItemKey(itemKey, item, idx)))));
    const visibleStart = visibleStateArr.indexOf(true);
    if (visibleStart < 0) {
        return null;
    }
    return [items.slice(0, visibleStart), items.slice(visibleStateArr.lastIndexOf(true) + 1)];
}

export default class OverflowListFoundation<P extends OverflowListBaseProps = OverflowListBaseProps, S extends OverflowListBaseState = OverflowListBaseState> extends BaseFoundation<OverflowListAdapter<P, S>, P, S> {
    #previousY = undefined;
    #notifiedOverflow: Array<Record<string, any>> = [];
    #itemSizes = new Map<ItemKey, number>();

    #syncScrollOverflowCache(nextVisibleState: Map<string, boolean>) {
        if (!this.isScrollMode()) {
            return;
        }
        const { items, itemKey } = this.getProps();
        const scrollOverflow = computeScrollOverflow(items, itemKey, nextVisibleState);
        if (scrollOverflow) {
            this._adapter.updateView({ scrollOverflow });
        }
    }

    // compared by content, not pivot: new items can overflow at the same pivot
    #notifyOverflow(overflow: Array<Record<string, any>>) {
        if (!isEqual(this.#notifiedOverflow, overflow)) {
            this.#notifiedOverflow = overflow;
            this._adapter.notifyOverflow(overflow);
        }
    }

    protected isScrollMode() {
        const { renderMode } = this.getProps();
        return renderMode === 'scroll';
    }

    protected getReversedItems() {
        const { items } = this.getProps();
        return items.toReversed();
    }

    /** The visibleState table is keyed by the stringified item key, the form data-scrollkey carries */
    static getItemKey(itemKey: ItemKeyOption, item: Record<string, any>, defaultKey?: ItemKey): ItemKey {
        if (typeof itemKey === 'function') {
            return itemKey(item);
        }
        return get(item, itemKey || 'key', defaultKey);
    }

    static getItemKeys(items: Array<Record<string, any>>, itemKey: ItemKeyOption): ItemKey[] {
        return items.map((item, idx) => OverflowListFoundation.getItemKey(itemKey, item, idx));
    }

    /** Called during render, so it takes the render's props and state instead of reading the adapter */
    static getOverflowItem(
        { items, itemKey }: { items?: Array<Record<string, any>>; itemKey?: ItemKeyOption },
        {
            visibleState,
            scrollOverflow = [[], []],
        }: {
            visibleState?: Map<string, boolean>;
            scrollOverflow?: ScrollOverflow;
        }
    ) {
        // before the observer reports, or with no visible item (layout not ready),
        // keep the last overflow to avoid flicker
        if (!visibleState || visibleState.size === 0) {
            return scrollOverflow;
        }
        return computeScrollOverflow(items, itemKey, visibleState) ?? scrollOverflow;
    }

    /**
     * Where the visible items sit in `items`, the inverse of how resetView and handleCollapseOverflow order them: a
     * start-collapsed list is reversed while measuring and a suffix once settled. Recording the layout with the view
     * lets a later collapseFrom change be noticed and reset; searching items by object would collapse a twice-listed
     * object to one position.
     */
    static getVisibleLayout({ items, visible }: Pick<OverflowListView, 'items' | 'visible'>, fromStart: boolean, reversed: boolean): VisibleLayout {
        if (reversed) {
            return { first: items.length - 1, step: -1, fromStart };
        }
        return { first: fromStart ? items.length - visible.length : 0, step: 1, fromStart };
    }

    /** The view a change of items or style starts from; the measurement then settles it */
    static resetView({ items, style, renderMode, collapseFrom, itemKey }: OverflowListBaseProps, view: OverflowListView, containerWidth: number): OverflowListView {
        const keys = OverflowListFoundation.getItemKeys(items, itemKey);
        const next: OverflowListView = { ...view, items, style, keys, overflowStatus: 'calculating' };
        if (renderMode === RenderMode.SCROLL) {
            // align the cache to the new items by key so removed items never show in the overflow
            if (!isEqual(view.items, items)) {
                const nextItems = new Map(items.map((item, idx) => [OverflowListFoundation.getItemKey(itemKey, item, idx), item]));
                const align = (list: Array<Record<string, any>>) => list.map((item, idx) => nextItems.get(OverflowListFoundation.getItemKey(itemKey, item, idx))).filter(Boolean);
                next.scrollOverflow = [align(view.scrollOverflow[0]), align(view.scrollOverflow[1])];
            }
            return { ...next, visible: items, overflow: [], maxCount: 0 };
        }
        let maxCount = items.length;
        if (Math.floor(containerWidth / numbers.MINIMUM_HTML_ELEMENT_WIDTH) !== 0) {
            maxCount = Math.min(maxCount, Math.floor(containerWidth / numbers.MINIMUM_HTML_ELEMENT_WIDTH));
        }
        const ordered = collapseFrom === Boundary.START ? items.toReversed() : items;
        return { ...next, visible: ordered.slice(0, maxCount), overflow: ordered.slice(maxCount), maxCount };
    }

    /** Returns whether the list must be measured again: an item changed width, or every visible item has reported */
    recordItemSize(key: ItemKey, width: number, maxCount: number) {
        const previous = this.#itemSizes.get(key);
        this.#itemSizes.set(key, width);
        return Boolean(previous && previous !== width) || this.#itemSizes.size === maxCount;
    }

    handleKeysChange(keys: ItemKey[]) {
        // items that keep their key are not reported again, so only the widths of removed keys go
        const keySet = new Set(keys);
        this.#itemSizes.forEach((_, key) => keySet.has(key) || this.#itemSizes.delete(key));
        this.setState({ visibleState: new Map() });
    }

    handleIntersect(entries: Array<IntersectionObserverEntry>) {
        const visibleState: Map<string, boolean> = new Map(this.getState('visibleState'));

        const res: Record<string, IntersectionObserverEntry> = {};
        entries.forEach((entry) => {
            const itemKey: string = (entry?.target as HTMLElement)?.dataset?.scrollkey;
            const visible = entry.isIntersecting;
            res[itemKey] = entry;
            visibleState.set(itemKey, visible);
        });
        const listInViewport = [...visibleState.values()].some(Boolean);
        // ignore the List scrolling out of view and the first report (#previousY unset)
        const [entry1] = entries;
        const currentY = entry1.boundingClientRect.y;
        if (!listInViewport && this.#previousY !== undefined && currentY !== this.#previousY) {
            this.#previousY = currentY;
            return;
        }
        this.#previousY = currentY;
        this._adapter.updateVisibleState(visibleState);
        this.#syncScrollOverflowCache(visibleState);
        this._adapter.notifyIntersect(res);
    }

    handleCollapseOverflow() {
        const { minVisibleItems, collapseFrom, itemKey } = this.getProps();
        const { overflowWidth, containerWidth } = this.getStates();
        const { items } = this.getProps();
        let itemWidths = 0,
            _pivot = 0;
        let overflowed = false;
        // nothing is measured, so the loop below cannot settle the list and it would stay hidden
        if (items.length === 0) {
            this._adapter.updateView({ overflowStatus: 'normal', pivot: -1, visible: items, overflow: [] });
            this.#notifyOverflow([]);
            return;
        }
        // widths are summed in collapse order, not in the order the table received them: items that keep their key are not reported again
        const keys = OverflowListFoundation.getItemKeys(items, itemKey);
        for (const key of collapseFrom === Boundary.START ? keys.toReversed() : keys) {
            const size = this.#itemSizes.get(key);
            if (size === undefined) {
                // not measured yet: leave the list calculating until every item reports
                return;
            }
            itemWidths += size;
            // the overflow node's width (kept from its last render) counts against every item but the last
            const isLast = _pivot === items.length - 1;
            if (itemWidths + (isLast ? 0 : overflowWidth) > containerWidth) {
                overflowed = true;
                break;
            }
            if (isLast) {
                this._adapter.updateView({
                    overflowStatus: 'normal',
                    pivot: items.length - 1,
                    visible: items,
                    overflow: [],
                });
                this.#notifyOverflow([]);
                break;
            }
            _pivot++;
        }
        if (overflowed) {
            const pivot = Math.max(minVisibleItems, _pivot);
            const isCollapseFromStart = collapseFrom === Boundary.START;
            const visible = isCollapseFromStart ? this.getReversedItems().slice(0, pivot).reverse() : items.slice(0, pivot);
            const overflow = isCollapseFromStart ? this.getReversedItems().slice(pivot).reverse() : items.slice(pivot);
            this._adapter.updateView({
                overflowStatus: 'overflowed',
                pivot: pivot,
                visible,
                overflow,
            });
            this.#notifyOverflow(overflow);
            return;
        }
    }
}
