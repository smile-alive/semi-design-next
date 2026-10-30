<script setup lang="ts" generic="R extends Record<string, any>">
    import { computed, normalizeStyle, onMounted, onUpdated, shallowRef, useAttrs, useId, useTemplateRef, watch, watchEffect, type CSSProperties, type HTMLAttributes, type StyleValue } from 'vue';
    import { cloneDeep, isEqual } from 'es-toolkit';
    import { get } from 'es-toolkit/compat';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/table/constants';
    import TableFoundation, { type BaseColumnProps, type BaseHeadWidth, type BaseRowKeyType, type TableAdapter } from '@fibrae/semi-foundation/table/foundation';
    import { amendTableWidth, flattenColumns, flattenData, getCellWidths, getHeaderRowCount, isMissingDataIndex, mergedRowExpandable, type FlattenData, type GroupFlattenData } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/table/table.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { RawSlots } from '../_base/read-vnode';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useRaf from '../_base/use-raf';
    import useResizeObserver from '../_base/use-resize-observer';
    import useSlotVersion from '../_base/use-slot-version';
    import type { VirtualListAlign } from '../_base/virtual-list.vue';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Spin from '../spin';
    import Body from './body/body.vue';
    import { provideTableContext, type RowEventName, type TableContextView, type TableFoundationProps as FoundationProps, type TableRowState, type TableState } from './context';
    import HeadTable from './head-table.vue';
    import type { ColumnProps, TableChangeInfo, TableEmits, TableHandle, TableHeaderCellSlotProps, TablePaginationProps, TableProps, TableRowKey, TableSlots, TableVirtualizedProps } from './interface';
    import TablePagination from './table-pagination.vue';
    import { expandColumn, mergePagination, selectionColumn } from './use-table-features';
    import { buildColumns, collectColumns, mergeComponents, slotOutput, toElement, type CollectedColumns } from './utils';

    type AnyRecord = Record<string, any>;
    type FoundationColumn = BaseColumnProps<AnyRecord>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TableProps<R>>(), {
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
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Table');

    const titleId = useId();

    // refs inside the v-for are arrays. Known limit: Vue updates the array in place on a remount, so the width watchers
    // below track the root only because it never remounts; give it a function ref if it gains a v-if or a changing key
    const roots = useTemplateRef('root');
    const wraps = useTemplateRef('wrap');
    const heads = useTemplateRef('head');

    // explicit type: the adapter reads this ref while the template reads foundation state, which would make inference circular
    const bodies = useTemplateRef<InstanceType<typeof Body>[]>('body');
    let lastScrollLeft: number | undefined;

    const slotVersion = useSlotVersion(slots);

    const direction = computed(() => props.direction ?? config.value.direction ?? 'ltr');
    const rowKey = computed(() => (props.rowKey ?? readSemiDefault(semi, 'Table', 'rowKey') ?? 'key') as TableRowKey);
    const groupBy = computed(() => (props.groupBy ?? readSemiDefault(semi, 'Table', 'groupBy')) as TableProps['groupBy']);
    const rowExpandableProp = computed(() => (props.rowExpandable ?? readSemiDefault(semi, 'Table', 'rowExpandable')) as TableProps['rowExpandable']);
    const onRow = computed(() => props.onRow ?? readSemiDefault(semi, 'Table', 'onRow'));
    const onHeaderRow = computed(() => props.onHeaderRow ?? readSemiDefault(semi, 'Table', 'onHeaderRow'));
    const onGroupedRow = computed(() => props.onGroupedRow ?? readSemiDefault(semi, 'Table', 'onGroupedRow'));
    const groupSectionColumn = computed(() => props.groupSectionColumn ?? readSemiDefault(semi, 'Table', 'groupSectionColumn'));

    const collected = computed<CollectedColumns>((prev) => {
        void slotVersion.value;
        return collectColumns(slots.default?.() ?? [], prev);
    });

    const cachedColumns = computed(() => (props.columns ? (props.columns as ColumnProps[]) : collected.value.columns));
    const flattened = computed(() => flattenColumns(cachedColumns.value) as ColumnProps[]);

    const hasExpandedRow = computed(() => {
        void slotVersion.value;
        return Boolean(slots.expandedRow);
    });

    // the foundation only tests whether it is a function; the content comes from the #expandedRow slot
    const expandedRowRender = () => null;

    warning(Boolean(props.columns && slots.default), '[Semi Table] columns should not given by object and children at the same time');

    // The default slot may only be called while rendering, so the first state holds just the data columns; the
    // columns of Table.Column children are merged in during the first render and the foundation re-initialized on mount
    type Foundation = TableFoundation<AnyRecord, FoundationProps>;
    type Adapter = TableAdapter<AnyRecord, FoundationProps>;

    /*
     * The foundation compares dataSource by reference, so rows added or removed in place (push, splice) get a new
     * reference for it; a new array with the same records (an inline literal re-rendered by the parent) keeps the old one.
     * Known limit: a record field changed in place re-renders its cell but does not sort or filter again; upgrade with an
     * explicit refresh once sorting or filtering on mutable fields is needed.
     */
    const dataSource = shallowRef<R[]>(props.dataSource ?? []);

    const fixedHeader = computed(() => Boolean(props.scroll?.y) || Boolean(props.sticky));
    const virtualized = computed(() => Boolean(props.virtualized));
    const splitTable = computed(() => fixedHeader.value || virtualized.value);

    const built = computed(() => {
        const origins = new WeakMap<ColumnProps, ColumnProps>();
        const columns = buildColumns(cachedColumns.value, [expandColumn(props, props.prefixCls), selectionColumn(props.rowSelection as TableProps['rowSelection'], props.prefixCls)], origins);
        return { columns, origins };
    });

    const flattenedColumns = computed(() => flattenColumns(built.value.columns) as ColumnProps[]);
    const anyColumnFixed = computed(() => built.value.columns.some((column) => Boolean(column.fixed)));
    const components = computed(() => mergeComponents(props.components, virtualized.value));

    // a hidden header is inert, so its rows are not rows of the table
    const headerRowCount = computed(() => (props.showHeader ? getHeaderRowCount(built.value.columns) : 0));
    const tableLayout = computed(() => (flattenedColumns.value.some((column) => Boolean(column.ellipsis) || Boolean(column.fixed)) || fixedHeader.value ? 'fixed' : 'auto'));
    const EMPTY_FLATTEN_DATA: (FlattenData | GroupFlattenData)[] = [];

    // The wrapper width gives the width of section and expanded rows and the fixed column shadows. It goes to a CSS
    // variable rather than state: a window drag resizes the table every frame, and state would re-render every cell
    const needSyncTableWidth = computed(() => anyColumnFixed.value || (props.showHeader && fixedHeader.value));
    const paginationPosition = computed(() => (props.pagination as TablePaginationProps | undefined)?.position ?? 'bottom');
    const formatPageText = computed(() => (props.pagination as TablePaginationProps | undefined)?.formatPageText);

    const toFoundationColumns = (columns: ColumnProps[]) => columns as unknown as FoundationColumn[];

    const fromFoundationColumns = (columns?: FoundationColumn[]) => (columns ?? []) as unknown as ColumnProps[];

    const getRowSelectionFn = (state: TableState, name: string) => {
        const fn = get(state.rowSelection, name);
        return typeof fn === 'function' ? fn : () => undefined;
    };

    const rowExpandable = (record: AnyRecord) =>
        mergedRowExpandable(record, {
            childrenRecordName: props.childrenRecordName,
            hasExpandedRow: hasExpandedRow.value,
            rowExpandable: rowExpandableProp.value,
        });

    const resolveColumnSlot = (name: string, column: ColumnProps) => {
        const own = props.columns ? undefined : collected.value.slots.get(built.value.origins.get(column) ?? column)?.[name];
        return own ?? (slots as RawSlots)[name === 'title' ? 'headerCell' : name];
    };

    const renderTitle = (column: ColumnProps, titleProps: TableHeaderCellSlotProps) => slotOutput(resolveColumnSlot('title', column), titleProps) ?? column.title;

    // synced on the DOM, not state, so a horizontal scroll re-renders nothing
    const handleBodyScroll = (event: Event) => {
        const target = event.target as HTMLElement;
        if (event.currentTarget !== target) {
            return;
        }
        const head = toElement(heads.value?.[0]);
        const body = bodies.value?.[0]?.element();
        if (target.scrollLeft !== lastScrollLeft) {
            if (target === body && head) {
                head.scrollLeft = target.scrollLeft;
            } else if (target === head && body) {
                body.scrollLeft = target.scrollLeft;
            }
        }
        lastScrollLeft = target.scrollLeft;
        foundation.syncScrollEdges();
    };

    const syncTableWidth = () => {
        const root = roots.value?.[0];
        root?.style.setProperty('--semi-table-section-width', `${amendTableWidth(root.getBoundingClientRect().width)}px`);
    };

    const isNameKey = (key: string) => key === 'aria-label' || key === 'aria-labelledby' || key === 'aria-describedby';

    watch(
        () => props.dataSource,
        (next, previous) => {
            const list = next ?? [];
            const current = dataSource.value;
            if (next === previous) {
                dataSource.value = [...list];
            } else if (list.length !== current.length || list.some((record, index) => record !== current[index])) {
                dataSource.value = list;
            }
        },
        { deep: 1 }
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, TableState>(
        TableFoundation,
        props as Readonly<Partial<FoundationProps>>,
        (view) => {
            const columns = toFoundationColumns(props.columns ? flattened.value : []);
            const queries = TableFoundation.initColumnsFilteredValueAndSorterOrder<AnyRecord>(cloneDeep(columns));
            return TableFoundation.getInitialState<AnyRecord>(view, columns, queries);
        },
        (base) => ({
            resetScrollY: () => {
                const body = bodies.value?.[0]?.element();
                if (props.scroll?.y) {
                    if (body) {
                        body.scrollTop = 0;
                    }
                } else {
                    wraps.value?.[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            },
            getScrollMetrics: () => TableFoundation.readScrollMetrics(bodies.value?.[0]?.element()),
            setScrollableEdges: (edges) => TableFoundation.writeScrollableEdges(bodies.value?.[0]?.element(), edges),
            setSelectedRowKeys: (selectedRowKeys) =>
                base.setState({
                    rowSelection: {
                        ...base.getState('rowSelection'),
                        selectedRowKeys: [...selectedRowKeys],
                        selectedRowKeysSet: new Set(selectedRowKeys),
                    },
                }),
            setPageDisabledRowKeys: (pageDisabledRowKeys) => base.setState({ pageDisabledRowKeys, pageDisabledRowKeysSet: new Set(pageDisabledRowKeys) }),
            setPagination: (pagination) => base.setState({ pagination }),
            setGroups: (groups) => base.setState({ groups }),
            setDataSource: (records) => base.setState({ dataSource: records }),
            setExpandedRowKeys: (expandedRowKeys) => base.setState({ expandedRowKeys: [...expandedRowKeys] }),
            setQueries: (queries) => base.setState({ queries }),
            setAllRowKeys: (allRowKeys) => base.setState({ allRowKeys }),
            setCachedFilteredSortedDataSource: (filteredSortedDataSource) => base.setState({ filteredSortedDataSource }),
            setCachedFilteredSortedRowKeys: (filteredSortedRowKeys) => base.setState({ filteredSortedRowKeys, filteredSortedRowKeysSet: new Set(filteredSortedRowKeys) }),
            setFilteredDisabledRowKeys: (filteredDisabledRowKeys) => base.setState({ filteredDisabledRowKeys, filteredDisabledRowKeysSet: new Set(filteredDisabledRowKeys) }),
            getCurrentPage: () => base.getStates().pagination?.currentPage ?? 1,
            getCachedFilteredSortedDataSource: () => base.getState('filteredSortedDataSource') ?? [],
            getCachedFilteredSortedRowKeys: () => base.getState('filteredSortedRowKeys') ?? [],
            getFilteredDisabledRowKeysSet: () => base.getState('filteredDisabledRowKeysSet') ?? new Set(),
            getHalfCheckedRowKeys: () => base.getState('halfCheckedRowKeys') ?? [],
            setHalfCheckedRowKeys: (halfCheckedRowKeys) => base.setState({ halfCheckedRowKeys, halfCheckedRowKeysSet: new Set(halfCheckedRowKeys) }),
            getKeyEntities: () => base.getState('keyEntities') ?? {},
            setKeyEntities: (keyEntities) => base.setState({ keyEntities }),
            getCheckRelation: () => base.getState('rowSelection')?.checkRelation ?? 'unRelated',
            notifyFilterDropdownVisibleChange: (visible, dataIndex) => {
                const column = dataIndex ? base.getState('queries')?.find((query) => query.dataIndex === dataIndex) : undefined;
                column?.onFilterDropdownVisibleChange?.(visible);
            },
            notifyChange: (changeInfo) => emit('change', changeInfo as TableChangeInfo<R>),
            notifyExpand: (expanded, record, mouseEvent) => emit('expand', expanded, record as R, mouseEvent),
            notifyExpandedRowsChange: (expandedRows, expandedRowKeys) => {
                emit('update:expandedRowKeys', expandedRowKeys);
                emit('expandedRowsChange', expandedRows as R[]);
            },
            notifySelect: (record, selected, selectedRows, event) => getRowSelectionFn(base.getStates(), 'onSelect')(record, selected, selectedRows, event),
            notifySelectAll: (selected, selectedRows, changedRows, event) => getRowSelectionFn(base.getStates(), 'onSelectAll')(selected, selectedRows, changedRows, event),
            notifySelectionChange: (selectedRowKeys, selectedRows) => getRowSelectionFn(base.getStates(), 'onChange')(selectedRowKeys, selectedRows),
        }),
        {
            props: {
                dataSource: () => dataSource.value,
                rowKey: () => rowKey.value,
                groupBy: () => groupBy.value,
                rowExpandable: () => rowExpandableProp.value,
                expandedRowRender: () => (hasExpandedRow.value ? expandedRowRender : undefined),
            },
        }
    );

    // derived during render as React does; the watch below writes it back for the foundation's event handlers
    const derived = computed(() => TableFoundation.deriveState(foundation.getProps(), state.value, toFoundationColumns(flattened.value)));
    const view = computed<TableState>(() => (derived.value ? { ...state.value, ...derived.value } : state.value));

    // a virtualized table counts all its rows in aria-rowcount, so the rows are flattened here rather than in the body
    const virtualizedData = computed(() =>
        virtualized.value
            ? flattenData(
                  {
                      rowKey: rowKey.value,
                      childrenRecordName: props.childrenRecordName,
                      expandedRowRender: hasExpandedRow.value ? expandedRowRender : undefined,
                      expandedRowKeys: view.value.expandedRowKeys,
                      groups: view.value.groups,
                      rowExpandable,
                  },
                  view.value.dataSource
              )
            : EMPTY_FLATTEN_DATA
    );

    const contextView = computed<TableContextView>(() => ({
        prefixCls: props.prefixCls,
        direction: direction.value,
        size: props.size,
        anyColumnFixed: anyColumnFixed.value,
        flattenedColumns: flattenedColumns.value,
        headWidths: view.value.headWidths ?? [],
        headerStyle: props.headerStyle,
        rowSpanHover: props.rowSpanHover,
        splitTable: splitTable.value,
        headerRowCount: headerRowCount.value,
        virtualized: virtualized.value,
        components: components.value,
        tableLayout: tableLayout.value,
        bodyHasScrollbar: Boolean(view.value.bodyHasScrollBar),
        queries: fromFoundationColumns(view.value.queries),
        scroll: props.scroll,
        sticky: props.sticky,
        showHeader: props.showHeader,
        virtualizedProps: typeof props.virtualized === 'object' ? (props.virtualized as TableVirtualizedProps) : undefined,
        childrenRecordName: props.childrenRecordName,
        indentSize: props.indentSize,
        hideExpandedColumn: props.hideExpandedColumn,
        expandIcon: props.expandIcon,
        expandRowByClick: props.expandRowByClick,
        keepDOM: Boolean(props.keepDOM),
        clickGroupedRowToExpand: Boolean(props.clickGroupedRowToExpand),
        hasExpandedRow: hasExpandedRow.value,
        onRow: onRow.value as TableProps['onRow'],
        onHeaderRow: onHeaderRow.value as TableProps['onHeaderRow'],
        onGroupedRow: onGroupedRow.value as TableProps['onGroupedRow'],
        groupSectionColumn: groupSectionColumn.value as TableProps['groupSectionColumn'],
    }));

    const rowState = computed<TableRowState>(() => ({
        rowSelection: view.value.rowSelection,
        filteredDisabledRowKeysSet: view.value.filteredDisabledRowKeysSet ?? new Set(),
        halfCheckedRowKeysSet: view.value.halfCheckedRowKeysSet ?? new Set(),
        filteredSortedRowKeys: view.value.filteredSortedRowKeys ?? [],
        filteredSortedRowKeysSet: view.value.filteredSortedRowKeysSet ?? new Set(),
        expandedRowKeys: view.value.expandedRowKeys ?? [],
        expandIcon: props.expandIcon,
        rowKey: rowKey.value,
    }));

    const mergedPagination = computed(() => (props.pagination ? mergePagination(view.value.pagination as TablePaginationProps | undefined, Boolean(props.scroll?.scrollToFirstRowOnChange), foundation.setPage, foundation.resetScrollY) : null));

    const setHeadWidths = (widths: BaseHeadWidth[], index = 0) => {
        const prev = foundation.getState('headWidths') ?? [];
        if (!isEqual(prev[index], widths)) {
            const next = [...prev];
            next[index] = [...widths];
            foundation.setState({ headWidths: next });
        }
    };

    const setBodyHasScrollbar = (hasScrollbar: boolean) => {
        if (hasScrollbar !== foundation.getState('bodyHasScrollBar')) {
            foundation.setState({ bodyHasScrollBar: hasScrollbar });
        }
    };

    provideTableContext({
        view: contextView,
        rowState,
        foundation,
        slots: slots as TableSlots,
        resolveColumnSlot,
        renderTitle,
        setHeadWidths,
        getCellWidths: (columns: ColumnProps[]) => {
            const measured = getCellWidths(view.value.headWidths, columns);
            if (measured.length || !virtualized.value) {
                return measured;
            }
            // Nothing is measured before mount, and a virtualized body renders nothing without widths: the declared numeric
            // widths stand in for the first frame, and the selection and expand columns take their default widths.
            // shortcut: a column without a numeric width leaves the body to render after mount; upgrade if first-frame rows
            // are needed for such columns, which would require a width estimate.
            const declared = columns.map((column) => {
                if (column.key === strings.DEFAULT_KEY_COLUMN_SELECTION) {
                    return column.width ?? numbers.DEFAULT_WIDTH_COLUMN_SELECTION;
                }
                return column.key === strings.DEFAULT_KEY_COLUMN_EXPAND ? (column.width ?? numbers.DEFAULT_WIDTH_COLUMN_EXPAND) : column.width;
            });
            return declared.every((width) => typeof width === 'number') ? (declared as number[]) : [];
        },
        setBodyHasScrollbar,
        handleBodyScroll,
        handleRowExpanded: (expanded: boolean, key: BaseRowKeyType, event?: Event) => foundation.handleRowExpanded(expanded, key, event),
        handleRowSelection: (key: BaseRowKeyType, selected: boolean, event: Event) => foundation.handleRowClickSelection(key, selected, event),
        rowExpandable,
        emitRowEvent: (name: RowEventName, record: AnyRecord, event: MouseEvent) => (emit as (name: RowEventName, record: AnyRecord, event: MouseEvent) => void)(name, record, event),
        getProps: () => foundation.getProps() as TableProps,
        getState: () => state.value,
    });

    /** The parts of a render that read attrs and slots, which are not reactive */
    const renderFrame = () => {
        const { root, control } = splitControlAttrs(attrs, isNameKey);
        const { class: rootClass, style: rootStyle, ...rootRest } = root;
        const pageData = view.value.dataSource ?? [];
        const title = slots.title ? slotOutput(slots.title, { pageData }) : props.title || null;
        const footer = slots.footer ? slotOutput(slots.footer, { pageData }) : props.footer || null;
        const nameAttrs = title && control['aria-label'] == null && control['aria-labelledby'] == null ? { ...control, 'aria-labelledby': titleId } : control;
        // an array, so a string style is patched by property and keeps the width variable set on the element
        const style = normalizeStyle([rootStyle as StyleValue]) as CSSProperties;
        const rootStyles: StyleValue[] = [style, virtualized.value && style.width == null ? { width: toCssLength(props.scroll?.x) } : {}];
        return {
            rootRest,
            rootClass: rootClass as HTMLAttributes['class'],
            rootStyle: rootStyles,
            title,
            footer,
            nameAttrs,
        };
    };

    onMounted(() => {
        if (!props.columns && flattened.value.length) {
            // useFoundation already ran init() on the empty first state; run it again with the columns of the children so
            // the default sort order and filtered values apply before the first paint
            const columns = toFoundationColumns(flattened.value);
            foundation.setState({
                flattenColumns: columns,
                queries: TableFoundation.initColumnsFilteredValueAndSorterOrder<AnyRecord>(cloneDeep(columns)),
            });
            foundation.init();
        }
        watch(
            () => flattened.value.some(isMissingDataIndex),
            (missing) => warning(missing, `[Semi Table] The column with sorter or filter must pass the 'dataIndex' prop`),
            { immediate: true }
        );
        let committed = { props: { ...foundation.getProps() }, flatten: foundation.getState('flattenColumns') };
        watch(
            [flattened, dataSource, () => props.rowSelection, () => props.pagination, () => props.expandedRowKeys, () => props.expandAllRows, () => props.expandAllGroupRows],
            () => {
                const changes = TableFoundation.deriveState(foundation.getProps(), state.value, toFoundationColumns(flattened.value));
                if (changes) {
                    foundation.setState(changes);
                }
                foundation.handleUpdate(committed.props, committed.flatten);
                committed = { props: { ...foundation.getProps() }, flatten: foundation.getState('flattenColumns') };
            },
            { flush: 'pre' }
        );
    });

    const scheduleWidthSync = useRaf();

    watchEffect(
        () => {
            if (needSyncTableWidth.value && roots.value?.[0]) {
                syncTableWidth();
            }
        },
        { flush: 'post' }
    );

    useResizeObserver(
        () => (needSyncTableWidth.value ? (roots.value?.[0] ?? null) : null),
        () => scheduleWidthSync(syncTableWidth)
    );

    useResizeObserver(() => (anyColumnFixed.value ? (roots.value?.[0] ?? null) : null), foundation.syncScrollEdges);

    // content width changes without a wrapper resize (columns, data) are caught after the patch
    onUpdated(() => {
        if (anyColumnFixed.value) {
            foundation.syncScrollEdges();
        }
    });

    defineExpose<TableHandle<R>>({
        getCurrentPageData: () => {
            const pageData = foundation.getCurrentPageData();
            const result: ReturnType<TableHandle<R>['getCurrentPageData']> = {};
            if (pageData.dataSource) {
                result.dataSource = pageData.dataSource as R[];
            }
            if (pageData.groups) {
                result.groups = pageData.groups;
            }
            return cloneDeep(result);
        },
        scrollTo: (offset: number) => {
            const body = bodies.value?.[0];
            warning(!body?.hasList(), '[Semi Table] scrollTo only works with a mounted virtualized table');
            body?.scrollTo(offset);
        },
        scrollToItem: (index: number, align?: VirtualListAlign) => {
            const body = bodies.value?.[0];
            warning(!body?.hasList(), '[Semi Table] scrollToItem only works with a mounted virtualized table');
            body?.scrollToItem(index, align);
        },
    });
</script>

<template>
    <template v-for="(frame, frameIndex) in [renderFrame()]" :key="frameIndex">
        <div ref="root" v-bind="{ dir: props.direction ?? config.direction, ...frame.rootRest }" :class="[frame.rootClass, `${props.prefixCls}-wrapper`]" :data-column-fixed="String(anyColumnFixed)" :style="frame.rootStyle">
            <Spin size="large" :spinning="props.loading">
                <div
                    ref="wrap"
                    :class="{
                        [`${props.prefixCls}-${strings.SIZE_SMALL}`]: props.size === strings.SIZE_SMALL,
                        [`${props.prefixCls}-${strings.SIZE_MIDDLE}`]: props.size === strings.SIZE_MIDDLE,
                        [`${props.prefixCls}-virtualized`]: virtualized,
                        [`${props.prefixCls}-bordered`]: props.bordered,
                        [`${props.prefixCls}-fixed-header`]: Boolean(props.scroll?.y),
                    }"
                >
                    <TablePagination v-if="mergedPagination && (paginationPosition === 'top' || paginationPosition === 'both')" :formatPageText="formatPageText" :pagination="mergedPagination" />
                    <div v-if="frame.title" :id="titleId" :class="`${props.prefixCls}-title`" x-semi-prop="title">
                        <template v-if="typeof frame.title === 'string'">{{ frame.title }}</template>
                        <component :is="node" v-for="[node, key] in frame.title" v-else :key="key" />
                    </div>
                    <div :aria-rowcount="virtualized ? headerRowCount + virtualizedData.length : undefined" :class="`${props.prefixCls}-container`" :role="splitTable ? 'table' : undefined" v-bind="splitTable ? frame.nameAttrs : {}">
                        <HeadTable v-if="fixedHeader" ref="head" :columns="built.columns" />
                        <Body
                            ref="body"
                            :columns="built.columns"
                            :data-source="view.dataSource ?? []"
                            :expandedRowKeys="view.expandedRowKeys ?? []"
                            :groups="view.groups"
                            :includeHeader="!fixedHeader"
                            :pageDisabledRowKeysSet="view.pageDisabledRowKeysSet ?? new Set()"
                            :tableAttrs="splitTable ? undefined : frame.nameAttrs"
                            :virtualizedData="virtualizedData"
                            @scroll="(...args) => emit('scroll', ...args)"
                        >
                            <template #empty>
                                <div :class="`${props.prefixCls}-placeholder`">
                                    <div :class="`${props.prefixCls}-empty`" x-semi-prop="empty">
                                        <slot v-if="$slots.empty" name="empty" />
                                        <template v-else>{{ locale.locale.emptyText }}</template>
                                    </div>
                                </div>
                            </template>
                        </Body>
                        <div v-if="frame.footer" :class="`${props.prefixCls}-footer`" x-semi-prop="footer">
                            <template v-if="typeof frame.footer === 'string'">{{ frame.footer }}</template>
                            <component :is="node" v-for="[node, key] in frame.footer" v-else :key="key" />
                        </div>
                    </div>
                    <TablePagination v-if="mergedPagination && (paginationPosition === 'bottom' || paginationPosition === 'both')" :formatPageText="formatPageText" :pagination="mergedPagination" />
                </div>
            </Spin>
        </div>
    </template>
</template>
