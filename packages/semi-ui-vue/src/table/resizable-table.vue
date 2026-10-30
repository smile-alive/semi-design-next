<script setup lang="ts" generic="R extends Record<string, any>">
    import { computed, normalizeClass, onMounted, shallowReactive, useTemplateRef, watch } from 'vue';
    import { cloneDeep } from 'es-toolkit';
    import { numbers, strings } from '@fibrae/semi-foundation/table/constants';
    import { assignColumnKeys, findColumn } from '@fibrae/semi-foundation/table/utils';
    import { addClass, removeClass } from '@fibrae/semi-foundation/utils/classnames';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import type { EmitProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useSlotVersion from '../_base/use-slot-version';
    import type { VirtualListAlign } from '../_base/virtual-list.vue';
    import type { ColumnProps, ResizableProps, RowSelectionProps, TableComponents, TableEmits, TableHandle, TableProps, TableSlots } from './interface';
    import NormalTable from './normal-table.vue';
    import ResizableHeaderCell from './resizable-header-cell.vue';

    type ColumnKey = string | number;
    type ResizeOverride = Partial<ColumnProps>;

    /**
     * A Table whose column widths the header cells can drag; loaded only for `resizable`, so plain tables skip this code.
     * The props it reads are declared here, the rest of the Table props and listeners pass through to NormalTable; the
     * listeners are typed behind `@vue-ignore` so Table's re-emitting handlers infer their arguments.
     */
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

    const options = computed(() => (typeof props.resizable === 'object' ? (props.resizable as ResizableProps) : {}));

    /**
     * The columns prop with keys, plus width placeholders for the expand and selection columns that Table adds, so that
     * those columns can be resized too
     */
    const baseColumns = computed(() => {
        const columns = assignColumnKeys(cloneDeep(props.columns ?? [])) as ColumnProps[];
        // Table merges its own column into the placeholder in place, so the placeholder sits where Table puts the column
        const place = (column: ColumnProps, fixed: unknown) => (fixed === 'right' ? columns.push(column) : columns.unshift(column));
        if (hasExpandedRow.value && !props.hideExpandedColumn && !columns.some((column) => column.key === strings.DEFAULT_KEY_COLUMN_EXPAND)) {
            place({ key: strings.DEFAULT_KEY_COLUMN_EXPAND, width: numbers.DEFAULT_WIDTH_COLUMN_EXPAND }, props.expandCellFixed);
        }
        const rowSelection = props.rowSelection as RowSelectionProps | boolean | undefined;
        if (rowSelection && !(typeof rowSelection === 'object' && rowSelection.hidden) && !columns.some((column) => column.key === strings.DEFAULT_KEY_COLUMN_SELECTION)) {
            place(
                {
                    width: (typeof rowSelection === 'object' ? rowSelection.width : undefined) ?? numbers.DEFAULT_WIDTH_COLUMN_SELECTION,
                    key: strings.DEFAULT_KEY_COLUMN_SELECTION,
                    onHeaderCell: typeof rowSelection === 'object' ? rowSelection.onHeaderCell : undefined,
                },
                typeof rowSelection === 'object' ? rowSelection.fixed : undefined
            );
        }
        return columns;
    });

    const components = computed<TableComponents>(() => ({
        ...props.components,
        header: { ...props.components?.header, cell: props.components?.header?.cell ?? ResizableHeaderCell },
    }));

    const handlerClass = () => options.value.handlerClassName ?? 'resizing';

    const applyOverrides = (columns: ColumnProps[]) =>
        columns.map((column) => {
            const next: ColumnProps = { ...column, ...(column.key != null ? overrides.get(column.key) : undefined) };
            if (column.key != null && resizing.has(column.key)) {
                next.class = addClass(normalizeClass(next.class) || undefined, handlerClass());
            }
            if (Array.isArray(column.children) && column.children.length) {
                next.children = applyOverrides(column.children);
            }
            return next;
        });

    const resizableColumns = computed(() => applyOverrides(baseColumns.value));

    // The drag handlers read the latest columns, not those of the last render: the moves of a fast drag can arrive
    // before Vue renders the previous one
    const update = (column: ColumnProps, change: (current: ColumnProps) => ResizeOverride) => {
        const current = findColumn(resizableColumns.value, column) as ColumnProps | undefined;
        if (!current || current.key == null) {
            return;
        }
        overrides.set(current.key, { ...overrides.get(current.key), ...change(current) });
    };

    const setResizing = (column: ColumnProps, on: boolean) => {
        const current = findColumn(resizableColumns.value, column) as ColumnProps | undefined;
        if (current?.key == null) {
            return;
        }
        if (on) {
            resizing.add(current.key);
        } else {
            resizing.delete(current.key);
        }
    };

    const handleResize = (column: ColumnProps) => (_event: PointerEvent, data: { size: { width: number } }) =>
        update(column, (current) => {
            const change = { width: data.size.width };
            return { ...change, ...options.value.onResize?.({ ...current, ...change }) };
        });

    const handleResizeStart = (column: ColumnProps) => () => {
        setResizing(column, true);
        update(column, (current) => options.value.onResizeStart?.(current) ?? {});
    };

    const handleResizeStop = (column: ColumnProps) => () => {
        setResizing(column, false);
        update(column, (current) => {
            const change = { class: removeClass(normalizeClass(current.class) || undefined, handlerClass()) };
            return options.value.onResizeStop?.({ ...current, ...change }) ?? {};
        });
    };

    const withResizeHandlers = (columns: ColumnProps[]) =>
        columns.map((column) => {
            const own = column.onHeaderCell;
            const next: ColumnProps = {
                ...column,
                onHeaderCell: (headerColumn, columnIndex, rowIndex) => ({
                    ...own?.(headerColumn, columnIndex, rowIndex),
                    width: headerColumn.width,
                    onResize: handleResize(headerColumn),
                    onResizeStart: handleResizeStart(headerColumn),
                    onResizeStop: handleResizeStop(headerColumn),
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
