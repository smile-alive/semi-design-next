import { type JSX, type ValidComponent, For, createEffect, createMemo, on, onCleanup, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { type Rect, type VirtualItem, createVirtualizer } from '@tanstack/solid-virtual';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import type { ElementProps } from './element-props';
import mergeRefs from './merge-refs';
import useWatch from './use-watch';

export type VirtualListAlign = 'auto' | 'smart' | 'center' | 'end' | 'start';

export interface VirtualListHandle {
    /** Scrolls to a pixel offset from the top */
    scrollTo: (offset: number) => void;
    /** Scrolls the row into view; `smart` scrolls the least when the row is within a viewport of view, else centers it */
    scrollToItem: (index: number, align?: VirtualListAlign) => void;
    /** Re-reads every row size; call it when a size function would answer differently for the same row count */
    measure: () => void;
}

/** Live like component props: read the fields where they are used, do not destructure */
export interface VirtualListRowProps<T> {
    /** Changes for a row kept by `itemKey` when the rows before it change */
    readonly index: number;
    readonly style: JSX.CSSProperties;
    readonly data: T;
}

export interface VirtualListScrollArgs {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    /** true when the scroll came from `scrollTo` or `scrollToItem` rather than the user */
    scrollUpdateWasRequested: boolean;
}

export interface VirtualListProps<T> extends ElementProps<'div', 'children' | 'ref' | 'style' | 'onScroll'> {
    /** Called once with the handle while created, and with undefined on cleanup */
    ref?: (handle?: VirtualListHandle) => void;
    /** The scroll container element */
    outerRef?: (element: HTMLDivElement) => void;
    /** Viewport height in pixels; the rows in view are computed from it, not measured */
    height: number;
    /** A number is pixels */
    width?: number | string;
    itemCount: number;
    itemSize: number | ((index: number) => number);
    itemData: T;
    /** Identity of a row: a row keeps its DOM nodes while its key stays in view. The index when absent */
    itemKey?: (index: number, data: T) => PropertyKey;
    /** Rows rendered beyond each edge of the viewport */
    overscan?: number;
    /** Receives `ref`, `style`, `onScroll` and `children` and must land them on its scroll element */
    outerElementType?: ValidComponent;
    /** Receives `style` and `children` (the rows) */
    innerElementType?: ValidComponent;
    /** Called when the scroll offset changes */
    onScroll?: (args: VirtualListScrollArgs) => void;
    style?: JSX.CSSProperties;
    /** Renders one row, called once per row key; a component works as is */
    children: (row: VirtualListRowProps<T>) => JSX.Element;
}

/**
 * Fixed or per-row-height vertical list that renders only the rows in view. Lists whose rows take no focus (Tree,
 * TreeSelect, Cascader, Select) pass `tabIndex={-1}`: Chrome would otherwise make the scroll container a tab stop of
 * its own, while the widget, which scrolls the active row into view, is the only stop.
 */
export default function VirtualList<T>(props: VirtualListProps<T>) {
    const [local, rest] = splitProps(props, ['ref', 'outerRef', 'height', 'width', 'itemCount', 'itemSize', 'itemData', 'itemKey', 'overscan', 'outerElementType', 'innerElementType', 'onScroll', 'style', 'children']);

    let scroller: HTMLDivElement | undefined;
    let reportRect: ((rect: Rect) => void) | undefined;
    let lastScroll = { offset: 0, requested: false };

    const ref = untrack(() => local.ref);

    const virtualizer = createVirtualizer<HTMLDivElement, Element>({
        get count() {
            return local.itemCount;
        },
        getScrollElement: () => scroller ?? null,
        estimateSize: (index) => (typeof local.itemSize === 'number' ? local.itemSize : local.itemSize(index)),
        get overscan() {
            return local.overscan ?? 2;
        },
        // The viewport size is the height prop: measuring reads 0 in jsdom and needs a ResizeObserver to follow a change
        get initialRect() {
            return { width: 0, height: local.height };
        },
        observeElementRect: (_instance, report) => {
            reportRect = report;
            report({ width: 0, height: local.height });
            return () => {
                reportRect = undefined;
            };
        },
    });

    // solid-virtual reconciles its items by index, so a row keyed by itemKey looks its item up by key. It updates them
    // in a computed that a row memo reading new itemData can run ahead of, so items past a shortened list are skipped
    const itemsByKey = createMemo(() => {
        const items = new Map<PropertyKey, VirtualItem>();
        for (const item of virtualizer.getVirtualItems()) {
            if (item.index < local.itemCount) {
                items.set(local.itemKey ? local.itemKey(item.index, local.itemData) : item.index, item);
            }
        }
        return items;
    });

    const keys = () => [...itemsByKey().keys()];

    const handleScroll = (event: Event & { currentTarget: HTMLElement }) => {
        const offset = event.currentTarget.scrollTop;
        // a horizontal scroll keeps the vertical offset and is not reported
        if (offset !== lastScroll.offset) {
            local.onScroll?.({
                scrollDirection: offset < lastScroll.offset ? 'backward' : 'forward',
                scrollOffset: offset,
                scrollUpdateWasRequested: lastScroll.requested,
            });
        }
        lastScroll = { offset, requested: false };
    };

    // Only a call that moves the list marks the next scroll event as requested: an instant scroll updates scrollTop
    // synchronously, and a call that leaves it in place fires no scroll event to clear the mark
    const request = (scroll: () => void) => {
        const before = scroller?.scrollTop;
        scroll();
        if (scroller?.scrollTop !== before) {
            lastScroll.requested = true;
        }
    };

    const renderRow = (key: PropertyKey) => {
        // the same store item while the key keeps its index, so a scroll only updates the fields that moved
        const item = createMemo(() => itemsByKey().get(key) as VirtualItem);
        return local.children({
            get index() {
                return item().index;
            },
            get style(): JSX.CSSProperties {
                return { position: 'absolute', 'inset-inline-start': 0, top: toCssLength(item().start), height: toCssLength(item().size), width: '100%' };
            },
            get data() {
                return local.itemData;
            },
        });
    };

    // Deferred, not useWatch: the virtualizer's onMount, created before this effect, reports the height of that moment
    createEffect(
        on(
            () => local.height,
            (height) => reportRect?.({ width: 0, height }),
            { defer: true }
        )
    );

    // The offsets are rebuilt only when the row count changes; a size function's caller calls measure() itself. The
    // rows measure at creation, so a size changed before the first effect run (a parent's onMount) needs one too
    useWatch(
        () => (typeof local.itemSize === 'number' ? local.itemSize : null),
        () => virtualizer.measure()
    );

    ref?.({
        scrollTo: (offset) => request(() => virtualizer.scrollToOffset(offset)),
        scrollToItem: (index, align = 'auto') =>
            request(() => {
                let resolved: 'auto' | 'center' | 'end' | 'start' = align === 'smart' ? 'auto' : align;
                if (align === 'smart') {
                    const [atStart = 0] = virtualizer.getOffsetForIndex(index, 'start') ?? [];
                    const [atEnd = 0] = virtualizer.getOffsetForIndex(index, 'end') ?? [];
                    const offset = scroller?.scrollTop ?? 0;
                    const viewport = virtualizer.scrollRect?.height ?? 0;
                    resolved = offset >= atEnd - viewport && offset <= atStart + viewport ? 'auto' : 'center';
                }
                virtualizer.scrollToIndex(index, { align: resolved });
            }),
        measure: () => virtualizer.measure(),
    });

    onCleanup(() => ref?.(undefined));

    return (
        <Dynamic component={local.outerElementType ?? 'div'} {...rest} ref={mergeRefs<HTMLDivElement>((node) => (scroller = node), local.outerRef)} style={{ position: 'relative', height: toCssLength(local.height), width: toCssLength(local.width ?? '100%'), overflow: 'auto', ...local.style }} onScroll={handleScroll}>
            <Dynamic component={local.innerElementType ?? 'div'} style={{ height: toCssLength(virtualizer.getTotalSize()), width: '100%' }}>
                <For each={keys()}>{(key) => renderRow(key)}</For>
            </Dynamic>
        </Dynamic>
    );
}
