<script setup lang="ts" generic="R extends Record<string, any>">
    import { computed, defineAsyncComponent, useTemplateRef } from 'vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import type { VirtualListAlign } from '../_base/virtual-list.vue';
    import type { TableEmits, TableHandle, TableProps, TableSlots } from './interface';
    import NormalTable from './normal-table.vue';

    // Global defaults resolve in NormalTable; undefined stops Vue from casting absent Booleans to false
    const props = withDefaults(defineProps<TableProps<R> & /* @vue-ignore */ ElementProps<'div', keyof TableProps<R> | EmitHandlers<TableEmits<R>>>>(), {
        bordered: undefined,
        clickGroupedRowToExpand: undefined,
        defaultExpandAllGroupRows: undefined,
        defaultExpandAllRows: undefined,
        direction: semiGlobalDefault('Table', 'direction'),
        expandAllGroupRows: undefined,
        expandAllRows: undefined,
        expandCellFixed: undefined,
        expandIcon: undefined,
        expandRowByClick: undefined,
        hideExpandedColumn: undefined,
        keepDOM: undefined,
        loading: undefined,
        pagination: undefined,
        resizable: undefined,
        rowSelection: undefined,
        rowSpanHover: undefined,
        showHeader: undefined,
        sticky: undefined,
        virtualized: undefined,
    });

    const emit = defineEmits<TableEmits<R>>();
    defineSlots<TableSlots<R>>();

    const semi = useSemiGlobal();

    const table = useTemplateRef('table');

    // Known limit: until the chunk first loads, a resizable table renders as NormalTable and remounts when it arrives,
    // dropping sorting, selection and emitted changes made meanwhile; import ResizableTable statically if that window matters
    const ResizableTable = defineAsyncComponent({
        loader: () => import('./resizable-table.vue'),
        loadingComponent: NormalTable,
        delay: 0,
    });

    const resizable = computed(() => (props.resizable ?? readSemiDefault(semi, 'Table', 'resizable')) as TableProps<R>['resizable']);

    defineExpose<TableHandle<R>>({
        getCurrentPageData: () => {
            if (!table.value) {
                throw new Error('[Semi Table] getCurrentPageData is called before the table is mounted');
            }
            return table.value.getCurrentPageData();
        },
        scrollTo: (offset: number) => table.value?.scrollTo(offset),
        scrollToItem: (index: number, align?: VirtualListAlign) => table.value?.scrollToItem(index, align),
    });
</script>

<template>
    <component
        :is="resizable ? ResizableTable : NormalTable"
        ref="table"
        v-bind="props"
        :resizable="resizable"
        @change="(...args) => emit('change', ...args)"
        @expand="(...args) => emit('expand', ...args)"
        @expandedRowsChange="(...args) => emit('expandedRowsChange', ...args)"
        @rowContextMenu="(...args) => emit('rowContextMenu', ...args)"
        @rowDoubleClick="(...args) => emit('rowDoubleClick', ...args)"
        @rowMouseEnter="(...args) => emit('rowMouseEnter', ...args)"
        @rowMouseLeave="(...args) => emit('rowMouseLeave', ...args)"
        @scroll="(...args) => emit('scroll', ...args)"
        @update:expandedRowKeys="(...args) => emit('update:expandedRowKeys', ...args)"
    >
        <template v-for="(_, name) in $slots" #[name]="scope">
            <slot :name="name as keyof TableSlots<R>" v-bind="scope" />
        </template>
    </component>
</template>
