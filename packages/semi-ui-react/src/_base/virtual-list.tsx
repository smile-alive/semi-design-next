import type React from 'react';
import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer, type Rect } from '@tanstack/react-virtual';
import useDidUpdate from './use-did-update';
import useMergedRef from './use-merged-ref';

export type VirtualListAlign = 'auto' | 'smart' | 'center' | 'end' | 'start';

export interface VirtualListHandle {
    /** Scrolls to a pixel offset from the top */
    scrollTo: (offset: number) => void;
    /** Scrolls the row into view; `smart` scrolls the least when the row is within a viewport of view, else centers it */
    scrollToItem: (index: number, align?: VirtualListAlign) => void;
    /** Re-reads every row size; call it when a size function would answer differently for the same row count */
    measure: () => void;
}

export interface VirtualListRowProps<T> {
    index: number;
    style: React.CSSProperties;
    data: T;
}

export interface VirtualListScrollArgs {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    /** true when the scroll came from `scrollTo` or `scrollToItem` rather than the user */
    scrollUpdateWasRequested: boolean;
}

export interface VirtualListProps<T> extends Omit<React.ComponentProps<'div'>, 'children' | 'ref' | 'onScroll'> {
    ref?: React.Ref<VirtualListHandle>;
    /** The scroll container element */
    outerRef?: React.Ref<HTMLDivElement>;
    /** Viewport height in pixels; the rows in view are computed from it, not measured */
    height: number;
    width?: number | string;
    itemCount: number;
    itemSize: number | ((index: number) => number);
    itemData: T;
    /** React key of a row; the index when absent */
    itemKey?: (index: number, data: T) => React.Key;
    /** Rows rendered beyond each edge of the viewport */
    overscan?: number;
    outerElementType?: React.ElementType;
    innerElementType?: React.ElementType;
    /** Called when the scroll offset changes */
    onScroll?: (args: VirtualListScrollArgs) => void;
    /** Renders one row; a module-level component, since a new type on each render would remount every row */
    children: React.ComponentType<VirtualListRowProps<T>>;
}

/**
 * Fixed or per-row-height vertical list that renders only the rows in view. Lists whose rows take no focus (Tree,
 * TreeSelect, Cascader, Select) pass `tabIndex={-1}`: Chrome would otherwise make the scroll container a tab stop of
 * its own, while the widget, which scrolls the active row into view, is the only stop.
 */
export default function VirtualList<T>({ ref, outerRef, height, width = '100%', itemCount, itemSize, itemData, itemKey, overscan = 2, outerElementType: Outer = 'div', innerElementType: Inner = 'div', onScroll, children: Row, style, ...rest }: VirtualListProps<T>) {
    // useVirtualizer returns one mutable instance for the component's life; memoized reads of it would go stale
    'use no memo';

    const scrollRef = useRef<HTMLDivElement>(null);
    const reportRect = useRef<((rect: Rect) => void) | null>(null);
    const lastScroll = useRef({ offset: 0, requested: false });

    // A row keeps its style object while its position and size hold, so a scroll that only shifts the rendered range
    // lets a memo row skip rendering. Holds at most one entry per row index ever rendered.
    const [rowStyles] = useState(() => new Map<number, React.CSSProperties>());

    const virtualizer = useVirtualizer({
        count: itemCount,
        getScrollElement: () => scrollRef.current,
        estimateSize: typeof itemSize === 'number' ? () => itemSize : itemSize,
        overscan,
        // viewport = height prop: measuring reads 0 in jsdom and needs a ResizeObserver to follow prop changes
        initialRect: { width: 0, height },
        observeElementRect: (_instance, report) => {
            reportRect.current = report;
            report({ width: 0, height });
            return () => {
                reportRect.current = null;
            };
        },
    });

    const attachOuter = useMergedRef(scrollRef, outerRef);

    const rowStyle = (index: number, top: number, rowHeight: number) => {
        const cached = rowStyles.get(index);
        if (cached?.top === top && cached.height === rowHeight) {
            return cached;
        }
        const next: React.CSSProperties = { position: 'absolute', insetInlineStart: 0, top, height: rowHeight, width: '100%' };
        rowStyles.set(index, next);
        return next;
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const offset = event.currentTarget.scrollTop;
        const last = lastScroll.current;
        if (offset !== last.offset) {
            onScroll?.({
                scrollDirection: offset < last.offset ? 'backward' : 'forward',
                scrollOffset: offset,
                scrollUpdateWasRequested: last.requested,
            });
        }
        lastScroll.current = { offset, requested: false };
    };

    useLayoutEffect(() => {
        reportRect.current?.({ width: 0, height });
    }, [height]);

    // offsets rebuild only on a row-count change; a caller passing a size function calls measure() itself
    useDidUpdate(typeof itemSize === 'number' ? itemSize : null, () => virtualizer.measure());

    useImperativeHandle(ref, () => {
        // Mark only calls that move the list: one that leaves scrollTop in place fires no scroll event to clear it
        const request = (scroll: () => void) => {
            const before = scrollRef.current?.scrollTop;
            scroll();
            if (scrollRef.current?.scrollTop !== before) {
                lastScroll.current.requested = true;
            }
        };
        return {
            scrollTo: (offset) => request(() => virtualizer.scrollToOffset(offset)),
            scrollToItem: (index, align = 'auto') =>
                request(() => {
                    let resolved: 'auto' | 'center' | 'end' | 'start' = align === 'smart' ? 'auto' : align;
                    if (align === 'smart') {
                        const [atStart = 0] = virtualizer.getOffsetForIndex(index, 'start') ?? [];
                        const [atEnd = 0] = virtualizer.getOffsetForIndex(index, 'end') ?? [];
                        const offset = scrollRef.current?.scrollTop ?? 0;
                        // read from the virtualizer (the height prop) so the imperative handle never changes
                        const viewport = virtualizer.scrollRect?.height ?? 0;
                        resolved = offset >= atEnd - viewport && offset <= atStart + viewport ? 'auto' : 'center';
                    }
                    virtualizer.scrollToIndex(index, { align: resolved });
                }),
            measure: () => virtualizer.measure(),
        };
    }, [virtualizer]);

    return (
        <Outer {...rest} ref={attachOuter} style={{ position: 'relative', height, width, overflow: 'auto', ...style }} onScroll={handleScroll}>
            <Inner style={{ height: virtualizer.getTotalSize(), width: '100%' }}>
                {virtualizer.getVirtualItems().map((item) => (
                    <Row key={itemKey ? itemKey(item.index, itemData) : item.index} style={rowStyle(item.index, item.start, item.size)} data={itemData} index={item.index} />
                ))}
            </Inner>
        </Outer>
    );
}
