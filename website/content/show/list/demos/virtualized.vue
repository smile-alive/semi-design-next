<script setup lang="ts">
    import { computed, shallowReactive, useTemplateRef, watch } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';
    import { Avatar, List, Spin } from '@fibrae/semi-ui-vue';

    interface Book {
        title: string;
    }

    const rowCount = 50;
    const rowHeight = 118;
    // Rows fetched ahead of the window so they arrive before they scroll into view
    const prefetch = 15;
    const dataList: Book[] = Array.from({ length: rowCount }, (_, i) => ({ title: `Semi Design Title ${i}` }));

    const scroller = useTemplateRef('scroller');
    const loaded = shallowReactive(new Set<number>());
    // A requested index is never fetched again, even while pending
    const requested = new Set<number>();
    const virtualizer = useVirtualizer({ count: rowCount, getScrollElement: () => scroller.value, estimateSize: () => rowHeight, overscan: 2 });

    const items = computed(() => virtualizer.value.getVirtualItems());
    const rows = computed(() => items.value.filter((item) => loaded.has(item.index)));

    watch(items, (current) => {
        if (!current.length) return;
        const wanted: number[] = [];
        for (let i = current[0].index; i <= Math.min(current[current.length - 1].index + prefetch, rowCount - 1); i++) {
            if (!requested.has(i)) {
                requested.add(i);
                wanted.push(i);
            }
        }
        if (!wanted.length) return;
        setTimeout(() => {
            for (const i of wanted) loaded.add(i);
        }, 1000);
    });
</script>

<template>
    <div :style="{ border: '1px solid var(--semi-color-border)', padding: '10px' }">
        <section ref="scroller" aria-label="虚拟滚动列表" :style="{ height: '500px', overflow: 'auto' }" tabindex="0">
            <List :style="{ position: 'relative', height: `${virtualizer.getTotalSize()}px` }">
                <!-- Replaces the locale's empty text until a row of the window arrives -->
                <template #emptyContent>
                    <Spin />
                </template>
                <List.Item v-for="item in rows" :key="item.index" :style="{ position: 'absolute', insetInline: '0', top: `${item.start}px`, height: `${rowHeight}px` }">
                    <template #header>
                        <Avatar color="grey">SE</Avatar>
                    </template>
                    <template #main>
                        <div>
                            <span :style="{ color: 'var(--semi-color-text-0)', fontWeight: 500 }">{{ dataList[item.index].title }}</span>
                            <p :style="{ color: 'var(--semi-color-text-2)', margin: '4px 0' }">Semi Design 设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
                        </div>
                    </template>
                </List.Item>
            </List>
        </section>
    </div>
</template>
