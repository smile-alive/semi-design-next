<script lang="ts" module>
    export type VirtualListAlign = 'auto' | 'smart' | 'center' | 'end' | 'start';
</script>

<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { type Rect, createVirtualizer } from '@tanstack/svelte-virtual';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';

    interface VirtualListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
        /** Viewport height in pixels; the rows in view are computed from it, not measured */
        height: number;
        /** A number is pixels */
        width?: number | string;
        itemCount: number;
        itemSize: number | ((index: number) => number);
        /** Key of a row; the index when absent */
        itemKey?: (index: number) => PropertyKey;
        /** Rows rendered beyond each edge of the viewport */
        overscan?: number;
        /** Attributes of the element that holds the rows */
        innerAttrs?: HTMLAttributes<HTMLElement>;
        /** Tag of the element that holds the rows; `ul` when the rows are `li` */
        innerTag?: 'div' | 'ul';
        /** Attributes of a div between the scroll container and the row holder, for styles that select the row holder as its direct child */
        wrapperAttrs?: HTMLAttributes<HTMLDivElement>;
        /** Rendered inside the scroll container after the rows, such as an empty placeholder */
        after?: Snippet;
        /** Renders one row; `style` positions it and goes on the row's element */
        children: Snippet<[{ index: number; style: string }]>;
    }

    /**
     * Fixed or per-row-height vertical list that renders only the rows in view. Attributes land on the scroll container;
     * lists whose rows take no focus pass `tabindex={-1}` so Chrome does not make the container a second tab stop.
     */
    let { height, width = '100%', itemCount, itemSize, itemKey, overscan = 2, innerAttrs, innerTag = 'div', wrapperAttrs, after, children, ...rest }: VirtualListProps = $props();

    let scroller = $state<HTMLDivElement>();
    let reportRect: ((rect: Rect) => void) | null = null;

    const options = () => ({
        count: itemCount,
        getScrollElement: () => scroller ?? null,
        estimateSize: (index: number) => (typeof itemSize === 'number' ? itemSize : itemSize(index)),
        overscan,
        // The viewport size is the height prop: measuring would read 0 in jsdom and needs a ResizeObserver to follow a
        // prop change
        initialRect: { width: 0, height },
        observeElementRect: (_instance: unknown, report: (rect: Rect) => void) => {
            reportRect = report;
            report({ width: 0, height });
            return () => {
                reportRect = null;
            };
        },
    });

    const virtualizer = createVirtualizer<HTMLDivElement, Element>(untrack(options));

    const rowStyle = (start: number, size: number) => `position: absolute; inset-inline-start: 0; top: ${start}px; height: ${size}px; width: 100%`;

    // The store emits on every setOptions, so reading it here untracked keeps the effect from re-running itself
    $effect(() => {
        const next = options();
        untrack(() => {
            $virtualizer.setOptions(next);
            reportRect?.({ width: 0, height: next.initialRect.height });
        });
    });

    // the offsets are only rebuilt when the row count changes; a size function's caller calls measure() itself
    $effect(() => {
        if (typeof itemSize === 'number') {
            untrack(() => $virtualizer.measure());
        }
    });

    /** Rebuilds the row offsets from `itemSize`; callers with a size function call it when the sizes change */
    export function measure() {
        $virtualizer.measure();
    }

    /** Scrolls the row into view; `smart` scrolls the least when the row is within a viewport of view, else centers it */
    export function scrollToItem(index: number, align: VirtualListAlign = 'auto') {
        const instance = $virtualizer;
        let resolved: 'auto' | 'center' | 'end' | 'start' = align === 'smart' ? 'auto' : align;
        if (align === 'smart') {
            const [atStart = 0] = instance.getOffsetForIndex(index, 'start') ?? [];
            const [atEnd = 0] = instance.getOffsetForIndex(index, 'end') ?? [];
            const offset = scroller?.scrollTop ?? 0;
            const viewport = instance.scrollRect?.height ?? 0;
            resolved = offset >= atEnd - viewport && offset <= atStart + viewport ? 'auto' : 'center';
        }
        instance.scrollToIndex(index, { align: resolved });
    }
</script>

<div bind:this={scroller} {...rest} style="position: relative; height: {toCssLength(height)}; width: {toCssLength(width)}; overflow: auto;{rest.style ?? ''}">
    {#snippet rows()}
        <svelte:element this={innerTag} {...innerAttrs} style="height: {$virtualizer.getTotalSize()}px; width: 100%">
            {#each $virtualizer.getVirtualItems() as item (itemKey ? itemKey(item.index) : item.index)}
                {@render children({ index: item.index, style: rowStyle(item.start, item.size) })}
            {/each}
        </svelte:element>
    {/snippet}
    {#if wrapperAttrs}
        <div {...wrapperAttrs}>{@render rows()}</div>
    {:else}
        {@render rows()}
    {/if}
    {@render after?.()}
</div>
