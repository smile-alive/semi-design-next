<script setup lang="ts">
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import ColGroup from './col-group.vue';
    import { useTableContext } from './context';
    import type { ColumnProps } from './interface';
    import TableHeader from './table-header.vue';

    const props = defineProps<{ columns: ColumnProps[] }>();

    const table = useTableContext();

    const headStyle = () => {
        const { bodyHasScrollbar, sticky } = table.view.value;
        const top = typeof sticky === 'object' ? (sticky.top ?? 0) : 0;
        return { overflowY: bodyHasScrollbar ? ('scroll' as const) : undefined, top: toCssLength(top) };
    };
</script>

<template>
    <div
        :class="[
            `${table.view.value.prefixCls}-header`,
            {
                [`${table.view.value.prefixCls}-header-sticky`]: Boolean(table.view.value.sticky),
                [`${table.view.value.prefixCls}-header-hidden`]: !table.view.value.showHeader,
            },
        ]"
        :inert="!table.view.value.showHeader"
        :style="headStyle()"
        @scroll="table.handleBodyScroll"
    >
        <component :is="table.view.value.components.header.outer" :class="[table.view.value.prefixCls, { [`${table.view.value.prefixCls}-fixed`]: table.view.value.tableLayout === 'fixed' }]" role="none" :style="{ width: toCssLength(table.view.value.scroll?.x) }">
            <ColGroup :columns="props.columns" :prefixCls="table.view.value.prefixCls" />
            <TableHeader :columns="props.columns" />
        </component>
    </div>
</template>
