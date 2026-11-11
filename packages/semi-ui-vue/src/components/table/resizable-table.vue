<script setup lang="ts" generic="R extends Record<string, any>">
    import { computed, onMounted, shallowReactive, useTemplateRef, watch } from 'vue';
    import { applyColumnResize, findColumn, getColumnResizeChange, getExpandColumn, getResizableColumns, getSelectionColumn } from '@fibrae/semi-foundation/components/table/utils';
    import { warning } from '@fibrae/semi-foundation/utils';
    import { type EmitProps, semiDefault, semiGlobalDefault } from '../../base/index';
    import { useSlotVersion } from '../../composables/index';
    import type { VirtualListAlign } from '../../internal/index';
    import type { ColumnProps, ResizableProps, RowSelectionProps, TableComponents, TableEmits, TableHandle, TableProps, TableSlots } from './interface';
    import NormalTable from './normal-table.vue';
    import ResizableHeaderCell from './table-header/resizable-header-cell.vue';

    type ColumnKey = string | number;
    type ResizeOverride = Partial<ColumnProps>;

    /** The listeners are typed behind `@vue-ignore` so Table's re-emitting handlers infer their arguments. */
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<Pick<TableProps<R>, 'columns' | 'components' | 'expandCellFixed' | 'hideExpandedColumn' | 'resizable' | 'rowSelection'> & /* @vue-ignore */ EmitProps<TableEmits<R>>>(), {
        columns: semiGlobalDefault('Table', 'columns'),
        components: semiGlobalDefault('Table', 'components'),
        expandCellFixed: () => semiDefault('Table', 'expandCellFixed', false),
        hideExpandedColumn: () => semiDefault('Table', 'hideExpandedColumn', true),
        resizable: () => semiDefault('Table', 'resizable', false) as NonNullable<TableProps<R>['resizable']>,
        rowSelection: semiGlobalDefault('Table', 'rowSelection'),
    });

    const slots = defineSlots<TableSlots<R>>();

    const table = useTemplateRef('table');

    /*
     * What dragging changed, by column key: the width and the fields the resize callbacks return. Only these outlive a
     * change of the columns prop; a column never dragged follows the prop.
     */
    const overrides = shallowReactive(new Map<ColumnKey, ResizeOverride>());
    const resizing = shallowReactive(new Set<ColumnKey>());

    const slotVersion = useSlotVersion(slots);

    const hasExpandedRow = computed(() => {
        void slotVersion.value;
        return Boolean(slots.expandedRow);
    });

    // Only the columns prop is resizable, as documented: Table.Column children render as a plain table, and an empty
    // columns array is then left out, as in React, since NormalTable would let it win over the children
    const childColumnsOnly = computed(() => {
        void slotVersion.value;
        return !props.columns?.length && Boolean(slots.default);
    });

    const baseColumns = computed(() => getResizableColumns(props.columns as ColumnProps[] | undefined, hasExpandedRow.value ? getExpandColumn(props.hideExpandedColumn, props.expandCellFixed) : null, getSelectionColumn(props.rowSelection as RowSelectionProps | boolean | undefined)));

    const components = computed<TableComponents>(() => ({
        ...props.components,
        header: { ...props.components?.header, cell: props.components?.header?.cell ?? ResizableHeaderCell },
    }));

    const resizableColumns = computed(() => applyColumnResize(baseColumns.value, { resizable: props.resizable as ResizableProps | boolean, classKey: 'class', getOverride: (key) => overrides.get(key), isResizing: (key) => resizing.has(key) }));

    // Reads the latest overrides, not those of the last render: the moves of a fast drag can arrive before Vue renders
    // the previous one
    const handlePhase = (key: ColumnKey, phase: 'start' | 'move' | 'stop', width?: number) => {
        if (phase === 'start') {
            resizing.add(key);
        } else if (phase === 'stop') {
            resizing.delete(key);
        }
        const recorded = overrides.get(key);
        const column: ColumnProps = { ...findColumn(baseColumns.value, { key }), ...recorded };
        overrides.set(key, { ...recorded, ...getColumnResizeChange({ phase, column, recorded, resizable: props.resizable as ResizableProps | boolean, classKey: 'class', width }) });
    };

    const withResizeHandlers = (columns: ColumnProps[]) =>
        columns.map((column) => {
            const own = column.onHeaderCell;
            const key = column.key!;
            const next: ColumnProps = {
                ...column,
                onHeaderCell: (headerColumn, columnIndex, rowIndex) => ({
                    ...own?.(headerColumn, columnIndex, rowIndex),
                    width: headerColumn.width,
                    onResize: (_event: PointerEvent, data: { size: { width: number } }) => handlePhase(key, 'move', data.size.width),
                    onResizeStart: () => handlePhase(key, 'start'),
                    onResizeStop: () => handlePhase(key, 'stop'),
                }),
            };
            if (Array.isArray(column.children) && column.children.length) {
                next.children = withResizeHandlers(column.children);
            }
            return next;
        });

    const finalColumns = computed(() => withResizeHandlers(resizableColumns.value));

    onMounted(() => {
        watch(childColumnsOnly, (only) => warning(only, '[Semi Table] resizable only works with the columns prop; Table.Column children render without resize handles'), { immediate: true });
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
    <NormalTable ref="table" v-bind="$attrs" :columns="childColumnsOnly ? undefined : (finalColumns as ColumnProps<R>[])" :components="childColumnsOnly ? props.components : components" :expandCellFixed="props.expandCellFixed" :hideExpandedColumn="props.hideExpandedColumn" :rowSelection="props.rowSelection">
        <template v-for="(_, name) in $slots" #[name]="scope">
            <slot :name="name as keyof TableSlots<R>" v-bind="scope" />
        </template>
    </NormalTable>
</template>
