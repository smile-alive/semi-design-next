<script setup lang="ts">
    import { computed, useTemplateRef, watch, type CSSProperties } from 'vue';
    import { useVirtualizer, type Rect } from '@tanstack/vue-virtual';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import SlotFragment from './slot-fragment';

    export type VirtualListAlign = 'auto' | 'smart' | 'center' | 'end' | 'start';

    export interface VirtualListHandle {
        /** Scrolls to a pixel offset from the top */
        scrollTo: (offset: number) => void;
        /** Scrolls the row into view; `smart` scrolls the least when the row is within a viewport of view, else centers it */
        scrollToItem: (index: number, align?: VirtualListAlign) => void;
        /** Re-reads every row size; call it when a size function would answer differently for the same row count */
        measure: () => void;
    }

    export interface VirtualListScrollArgs {
        scrollDirection: 'forward' | 'backward';
        scrollOffset: number;
        /** true when the scroll came from `scrollTo` or `scrollToItem` rather than the user */
        scrollUpdateWasRequested: boolean;
    }

    /**
     * Fixed or per-row-height vertical list that renders only the rows in view. Attributes land on the scroll container;
     * lists whose rows take no focus pass `tabindex="-1"` so Chrome does not make the container a second tab stop.
     */
    const props = withDefaults(
        defineProps<{
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
            /** Element that holds the rows, such as `ul` for `li` rows, since a list's content model admits only items */
            innerTag?: string;
            innerAttrs?: Record<string, unknown>;
            /**
             * Renders a div with these attributes between the scroll container and the row container, for styles that
             * select the row container as a direct child of a wrapper (Table's `.semi-table-fixed > .semi-table-tbody`)
             */
            wrapperAttrs?: Record<string, unknown>;
        }>(),
        { width: '100%', itemKey: undefined, overscan: 2, innerTag: 'div', innerAttrs: undefined, wrapperAttrs: undefined }
    );

    const emit = defineEmits<{ scroll: [args: VirtualListScrollArgs] }>();

    defineSlots<{
        default(props: { index: number; style: CSSProperties }): unknown;
        /** Content inside the scroll container after the rows, such as an empty state */
        after?(): unknown;
    }>();

    const scroller = useTemplateRef('scroller');
    let reportRect: ((rect: Rect) => void) | null = null;
    let lastScroll = { offset: 0, requested: false };

    const virtualizer = useVirtualizer<HTMLDivElement, Element>(
        computed(() => ({
            count: props.itemCount,
            getScrollElement: () => scroller.value,
            estimateSize: (index: number) => (typeof props.itemSize === 'number' ? props.itemSize : props.itemSize(index)),
            overscan: props.overscan,
            // The viewport size is the height prop: measuring would read 0 in jsdom and needs a ResizeObserver to follow a
            // prop change
            initialRect: { width: 0, height: props.height },
            observeElementRect: (_instance: unknown, report: (rect: Rect) => void) => {
                reportRect = report;
                report({ width: 0, height: props.height });
                return () => {
                    reportRect = null;
                };
            },
        }))
    );

    // Only a call that moves the list marks the next scroll event as requested: an instant scroll updates scrollTop
    // synchronously, and a call that leaves it in place fires no scroll event to clear the mark
    const request = (scroll: () => void) => {
        const before = scroller.value?.scrollTop;
        scroll();
        if (scroller.value?.scrollTop !== before) {
            lastScroll.requested = true;
        }
    };

    const handleScroll = (event: Event) => {
        const offset = (event.currentTarget as HTMLDivElement).scrollTop;
        // a horizontal scroll keeps the vertical offset and is not reported
        if (offset !== lastScroll.offset) {
            emit('scroll', {
                scrollDirection: offset < lastScroll.offset ? 'backward' : 'forward',
                scrollOffset: offset,
                scrollUpdateWasRequested: lastScroll.requested,
            });
        }
        lastScroll = { offset, requested: false };
    };

    watch(
        () => props.height,
        (height) => reportRect?.({ width: 0, height })
    );

    // the offsets are only rebuilt when the row count changes; a size function's caller calls measure() itself
    watch(
        () => (typeof props.itemSize === 'number' ? props.itemSize : null),
        () => virtualizer.value.measure()
    );

    defineExpose<VirtualListHandle>({
        scrollTo: (offset) => request(() => virtualizer.value.scrollToOffset(offset)),
        scrollToItem: (index, align = 'auto') =>
            request(() => {
                const instance = virtualizer.value;
                let resolved: 'auto' | 'center' | 'end' | 'start' = align === 'smart' ? 'auto' : align;
                if (align === 'smart') {
                    const [atStart = 0] = instance.getOffsetForIndex(index, 'start') ?? [];
                    const [atEnd = 0] = instance.getOffsetForIndex(index, 'end') ?? [];
                    const offset = scroller.value?.scrollTop ?? 0;
                    const viewport = instance.scrollRect?.height ?? 0;
                    resolved = offset >= atEnd - viewport && offset <= atStart + viewport ? 'auto' : 'center';
                }
                instance.scrollToIndex(index, { align: resolved });
            }),
        measure: () => virtualizer.value.measure(),
    });
</script>

<template>
    <div ref="scroller" :style="{ position: 'relative', height: toCssLength(props.height), width: toCssLength(props.width), overflow: 'auto' }" @scroll="handleScroll">
        <component :is="props.wrapperAttrs ? 'div' : SlotFragment" v-bind="props.wrapperAttrs">
            <component :is="props.innerTag" v-bind="props.innerAttrs" :style="{ height: toCssLength(virtualizer.getTotalSize()), width: '100%' }">
                <template v-for="item in virtualizer.getVirtualItems()" :key="props.itemKey ? props.itemKey(item.index) : item.index">
                    <slot
                        :index="item.index"
                        :style="{
                            position: 'absolute',
                            insetInlineStart: 0,
                            top: toCssLength(item.start),
                            height: toCssLength(item.size),
                            width: '100%',
                        }"
                    />
                </template>
            </component>
        </component>
        <slot name="after" />
    </div>
</template>
