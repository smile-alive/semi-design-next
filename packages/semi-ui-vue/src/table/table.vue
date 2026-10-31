<script setup lang="ts" generic="R extends Record<string, any>">
    import { computed, defineAsyncComponent, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/table/constants';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useSlotVersion from '../_base/use-slot-version';
    import type { VirtualListAlign } from '../_base/virtual-list.vue';
    import type { TableEmits, TableHandle, TableProps, TableSlots } from './interface';
    import NormalTable from './normal-table.vue';
    import { collectColumns, type CollectedColumns } from './utils';

    const props = withDefaults(defineProps<TableProps<R> & /* @vue-ignore */ ElementProps<'div', keyof TableProps<R> | EmitHandlers<TableEmits<R>>>>(), {
        bordered: () => semiDefault('Table', 'bordered', false),
        childrenRecordName: () => semiDefault('Table', 'childrenRecordName', 'children'),
        clickGroupedRowToExpand: semiGlobalDefault('Table', 'clickGroupedRowToExpand'),
        columns: semiGlobalDefault('Table', 'columns'),
        components: semiGlobalDefault('Table', 'components'),
        dataSource: () => semiDefault('Table', 'dataSource', []) as R[],
        defaultExpandAllGroupRows: () => semiDefault('Table', 'defaultExpandAllGroupRows', false),
        defaultExpandAllRows: () => semiDefault('Table', 'defaultExpandAllRows', false),
        defaultExpandedRowKeys: () => semiDefault('Table', 'defaultExpandedRowKeys', []),
        direction: semiGlobalDefault('Table', 'direction'),
        expandAllGroupRows: () => semiDefault('Table', 'expandAllGroupRows', false),
        expandAllRows: () => semiDefault('Table', 'expandAllRows', false),
        expandCellFixed: () => semiDefault('Table', 'expandCellFixed', false),
        expandIcon: semiGlobalDefault('Table', 'expandIcon'),
        expandedRowKeys: semiGlobalDefault('Table', 'expandedRowKeys'),
        expandRowByClick: () => semiDefault('Table', 'expandRowByClick', false),
        footer: semiGlobalDefault('Table', 'footer'),
        groupBy: undefined,
        groupSectionColumn: undefined,
        headerStyle: semiGlobalDefault('Table', 'headerStyle'),
        hideExpandedColumn: () => semiDefault('Table', 'hideExpandedColumn', true),
        indentSize: () => semiDefault('Table', 'indentSize', 20),
        keepDOM: semiGlobalDefault('Table', 'keepDOM'),
        loading: () => semiDefault('Table', 'loading', false),
        pagination: () => semiDefault('Table', 'pagination', true),
        prefixCls: () => semiDefault('Table', 'prefixCls', cssClasses.PREFIX),
        resizable: () => semiDefault('Table', 'resizable', false) as NonNullable<TableProps<R>['resizable']>,
        rowExpandable: undefined,
        rowKey: undefined,
        rowSelection: semiGlobalDefault('Table', 'rowSelection'),
        rowSpanHover: () => semiDefault('Table', 'rowSpanHover', false),
        scroll: semiGlobalDefault('Table', 'scroll'),
        showHeader: () => semiDefault('Table', 'showHeader', true),
        size: () => semiDefault('Table', 'size', 'default'),
        sticky: semiGlobalDefault('Table', 'sticky'),
        title: semiGlobalDefault('Table', 'title'),
        virtualized: semiGlobalDefault('Table', 'virtualized'),
        onGroupedRow: undefined,
        onHeaderRow: undefined,
        onRow: undefined,
    });

    const emit = defineEmits<TableEmits<R>>();
    const slots = defineSlots<TableSlots<R>>();

    const table = useTemplateRef('table');

    const slotVersion = useSlotVersion(slots);

    // Read during render, where a slot may be called, so the first state of the table, the server render included, has
    // the columns of the Table.Column children
    const collected = computed<CollectedColumns | undefined>((prev) => {
        void slotVersion.value;
        // an empty columns array also yields to the children when resizable, which drops it
        return props.columns?.length ? undefined : collectColumns(slots.default?.() ?? [], prev);
    });

    warning(Boolean(props.columns && slots.default), '[Semi Table] columns should not given by object and children at the same time');

    // Known limit: until the chunk first loads, a resizable table renders as NormalTable and remounts when it arrives,
    // dropping sorting, selection and emitted changes made meanwhile; import ResizableTable statically if that window matters
    const ResizableTable = defineAsyncComponent({
        loader: () => import('./resizable-table.vue'),
        loadingComponent: NormalTable,
        delay: 0,
    });

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
        :is="props.resizable ? ResizableTable : NormalTable"
        ref="table"
        v-bind="props"
        :collectedColumns="collected"
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
