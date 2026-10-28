<script setup lang="ts">
    import { parseHeaderRows } from '@fibrae/semi-foundation/table/utils';
    import { useTableContext } from './context';
    import type { ColumnProps } from './interface';
    import TableHeaderRow from './table-header-row.vue';

    const props = defineProps<{
        columns: ColumnProps[];
        /** Rendered only to measure the column widths of fixed columns: no height, and inert */
        hidden?: boolean;
    }>();

    const table = useTableContext();
</script>

<template>
    <component :is="table.view.value.components.header.wrapper" :class="[`${table.view.value.prefixCls}-thead`, { [`${table.view.value.prefixCls}-thead-hidden`]: props.hidden }]" :inert="props.hidden || undefined" :role="table.view.value.splitTable ? 'rowgroup' : undefined">
        <TableHeaderRow v-for="(row, index) in parseHeaderRows(props.columns)" :key="index" :columns="props.columns" :index="index" :row="row" />
    </component>
</template>
