<script setup lang="ts" generic="R extends Record<string, any>">
    import { computed, normalizeStyle, onUpdated, shallowRef, useAttrs, useId, useTemplateRef, watch, watchEffect, type CSSProperties, type HTMLAttributes, type StyleValue } from 'vue';
    import { cloneDeep } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/table/constants';
    import TableFoundation, { type BaseColumnProps, type BaseRowKeyType, type TableAdapter } from '@fibrae/semi-foundation/components/table/foundation';
    import { amendTableWidth, flattenColumns, flattenData, getCellWidths, getHeaderRowCount, mergedRowExpandable, type FlattenData, type GroupFlattenData } from '@fibrae/semi-foundation/components/table/utils';
    import { toCssLength, warning } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/table/table.scss';
    import { readSemiDefault, useSemiGlobal, useFoundation } from '../../base/index';
    import { useRaf, useResizeObserver, useSlotVersion } from '../../composables/index';
    import type { VirtualListAlign } from '../../internal/index';
    import { splitControlAttrs, type RawSlots } from '../../utils/index';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Spin from '../spin';
    import Body from './body/body.vue';
    import { provideTableContext, type RowEventName, type TableContextView, type TableFoundationProps as FoundationProps, type TableRowState, type TableState } from './context';
    import type { ColumnProps, RowSelectionProps, TableChangeInfo, TableEmits, TableHandle, TableHeaderCellSlotProps, TablePaginationProps, TableProps, TableRowKey, TableSlots, TableVirtualizedProps } from './interface';
    import HeadTable from './table-header/head-table.vue';
    import TablePagination from './table-pagination.vue';
    import { expandColumn, selectionColumn } from './use-table-features';
    import { buildColumns, mergeComponents, slotOutput, toElement, type CollectedColumns } from './utils';

    type AnyRecord = Record<string, any>;
    type FoundationColumn = BaseColumnProps<AnyRecord>;
    type Foundation = TableFoundation<AnyRecord, FoundationProps>;
    type Adapter = TableAdapter<AnyRecord, FoundationProps>;

    defineOptions({ inheritAttrs: false });
    const props = defineProps<TableProps<R> & { collectedColumns?: CollectedColumns }>();
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

    /*
     * The foundation compares dataSource by reference, so rows added or removed in place (push, splice) get a new
     * reference for it; a new array with the same records (an inline literal re-rendered by the parent) keeps the old one.
     * Known limit: a record field changed in place re-renders its cell but does not sort or filter again; upgrade with an
     * explicit refresh once sorting or filtering on mutable fields is needed.
     */
    const dataSource = shallowRef<R[]>(props.dataSource ?? []);

    const slotVersion = useSlotVersion(slots);

    // Table resolves every default before passing its props down; they stay optional in the declaration so that
    // ResizableTable can forward its attrs without listing them
    const resolved = props as typeof props & Required<Pick<TableProps, 'childrenRecordName' | 'expandRowByClick' | 'hideExpandedColumn' | 'indentSize' | 'rowSpanHover' | 'showHeader' | 'size'>>;
    const prefixCls = cssClasses.PREFIX;
    const direction = computed(() => props.direction ?? config.value.direction ?? 'ltr');
    const rowKey = computed(() => (props.rowKey ?? readSemiDefault(semi, 'Table', 'rowKey') ?? 'key') as TableRowKey);
    const groupBy = computed(() => (props.groupBy ?? readSemiDefault(semi, 'Table', 'groupBy')) as TableProps['groupBy']);
    const rowExpandableProp = computed(() => (props.rowExpandable ?? readSemiDefault(semi, 'Table', 'rowExpandable')) as TableProps['rowExpandable']);
    const onRow = computed(() => props.onRow ?? readSemiDefault(semi, 'Table', 'onRow'));
    const onHeaderRow = computed(() => props.onHeaderRow ?? readSemiDefault(semi, 'Table', 'onHeaderRow'));
    const onGroupedRow = computed(() => props.onGroupedRow ?? readSemiDefault(semi, 'Table', 'onGroupedRow'));
    const groupSectionColumn = computed(() => props.groupSectionColumn ?? readSemiDefault(semi, 'Table', 'groupSectionColumn'));
    const cachedColumns = computed(() => (props.columns ?? props.collectedColumns?.columns ?? []) as ColumnProps[]);
    const flattened = computed(() => flattenColumns(cachedColumns.value) as ColumnProps[]);

    const hasExpandedRow = computed(() => {
        void slotVersion.value;
        return Boolean(slots.expandedRow);
    });

    const fixedHeader = computed(() => Boolean(props.scroll?.y) || Boolean(props.sticky));
    const virtualized = computed(() => Boolean(props.virtualized));
    const splitTable = computed(() => fixedHeader.value || virtualized.value);

    const built = computed(() => {
        const origins = new WeakMap<ColumnProps, ColumnProps>();
        const columns = buildColumns(cachedColumns.value, [expandColumn(props, prefixCls), selectionColumn(props.rowSelection as TableProps['rowSelection'], prefixCls)], origins);
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

    // the foundation only tests whether it is a function; the content comes from the #expandedRow slot
    const expandedRowRender = () => null;

    const toFoundationColumns = (columns: ColumnProps[]) => columns as FoundationColumn[];

    const fromFoundationColumns = (columns?: FoundationColumn[]) => (columns ?? []) as ColumnProps[];

    const getRowSelection = () => (typeof props.rowSelection === 'object' ? (props.rowSelection as RowSelectionProps<R>) : undefined);

    const rowExpandable = (record: AnyRecord) =>
        mergedRowExpandable(record, {
            childrenRecordName: resolved.childrenRecordName,
            hasExpandedRow: hasExpandedRow.value,
            rowExpandable: rowExpandableProp.value,
        });

    const resolveColumnSlot = (name: string, column: ColumnProps) => {
        const own = props.columns ? undefined : props.collectedColumns?.slots.get(built.value.origins.get(column) ?? column)?.[name];
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
            const columns = toFoundationColumns(flattened.value);
            const queries = TableFoundation.initColumnsFilteredValueAndSorterOrder<AnyRecord>(cloneDeep(columns));
            return TableFoundation.getInitialState<AnyRecord>(view, columns, queries);
        },
        (base) => ({
            getWrapper: () => wraps.value?.[0],
            getBodyWrapper: () => bodies.value?.[0]?.element(),
            notifyFilterDropdownVisibleChange: (column, visible) => column.onFilterDropdownVisibleChange?.(visible),
            notifyPageChange: (currentPage, pageSize) => (base.getProp('pagination') as TablePaginationProps | undefined)?.onChange?.(currentPage, pageSize),
            notifyChange: (changeInfo) => emit('change', changeInfo as TableChangeInfo<R>),
            notifyExpand: (expanded, record, mouseEvent) => emit('expand', expanded, record as R, mouseEvent),
            notifyExpandedRowsChange: (expandedRows, expandedRowKeys) => {
                emit('update:expandedRowKeys', expandedRowKeys);
                emit('expandedRowsChange', expandedRows as R[]);
            },
            notifySelect: (record, selected, selectedRows, event) => getRowSelection()?.onSelect?.(record as R, selected, selectedRows as R[], event),
            notifySelectAll: (selected, selectedRows, changedRows, event) => getRowSelection()?.onSelectAll?.(selected, selectedRows as R[], changedRows as R[], event),
            notifySelectionChange: (selectedRowKeys, selectedRows) => getRowSelection()?.onChange?.(selectedRowKeys, selectedRows as R[]),
        }),
        {
            props: {
                dataSource: () => dataSource.value,
                rowKey: () => rowKey.value,
                groupBy: () => groupBy.value,
                rowExpandable: () => rowExpandableProp.value,
                expandedRowRender: () => (hasExpandedRow.value ? expandedRowRender : undefined),
                flattenColumns: () => toFoundationColumns(flattened.value),
            },
        }
    );

    const scheduleWidthSync = useRaf();

    // derived during render as React does; the foundation writes it back in handlePropsChange
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
        prefixCls,
        direction: direction.value,
        size: resolved.size,
        anyColumnFixed: anyColumnFixed.value,
        flattenedColumns: flattenedColumns.value,
        headWidths: view.value.headWidths ?? [],
        headerStyle: props.headerStyle,
        rowSpanHover: resolved.rowSpanHover,
        splitTable: splitTable.value,
        headerRowCount: headerRowCount.value,
        virtualized: virtualized.value,
        components: components.value,
        tableLayout: tableLayout.value,
        bodyHasScrollbar: Boolean(view.value.bodyHasScrollBar),
        queries: fromFoundationColumns(view.value.queries),
        scroll: props.scroll,
        sticky: props.sticky,
        showHeader: resolved.showHeader,
        virtualizedProps: typeof props.virtualized === 'object' ? (props.virtualized as TableVirtualizedProps) : undefined,
        childrenRecordName: resolved.childrenRecordName,
        indentSize: resolved.indentSize,
        hideExpandedColumn: resolved.hideExpandedColumn,
        expandIcon: props.expandIcon,
        expandRowByClick: resolved.expandRowByClick,
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

    // onChange replaced rather than merged: Vue's listener merge would call both
    const mergedPagination = computed(() => (props.pagination && view.value.pagination ? { ...(view.value.pagination as TablePaginationProps), onChange: foundation.handlePageChange } : null));

    provideTableContext({
        view: contextView,
        rowState,
        foundation,
        slots: slots as TableSlots,
        resolveColumnSlot,
        renderTitle,
        setHeadWidths: foundation.setHeadWidths,
        getCellWidths: (columns: ColumnProps[]) => getCellWidths(view.value.headWidths, columns, virtualized.value),
        setBodyHasScrollbar: foundation.setBodyHasScrollbar,
        handleBodyScroll,
        handleRowExpanded: (expanded: boolean, key: BaseRowKeyType, event?: Event) => foundation.handleRowExpanded(expanded, key, event),
        handleRowSelection: (key: BaseRowKeyType, selected: boolean, event: Event) => foundation.handleRowClickSelection(key, selected, event),
        rowExpandable,
        emitRowEvent: (name: RowEventName, record: AnyRecord, event: MouseEvent) => (emit as (name: RowEventName, record: AnyRecord, event: MouseEvent) => void)(name, record, event),
        getProps: () => foundation.getProps() as TableProps,
        getState: () => state.value,
    });

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
        getCurrentPageData: () => cloneDeep(foundation.getCurrentPageData()) as ReturnType<TableHandle<R>['getCurrentPageData']>,
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
        <div ref="root" v-bind="{ dir: props.direction ?? config.direction, ...frame.rootRest }" :class="[frame.rootClass, `${prefixCls}-wrapper`]" :data-column-fixed="String(anyColumnFixed)" :style="frame.rootStyle">
            <Spin size="large" :spinning="props.loading">
                <div
                    ref="wrap"
                    :class="{
                        [`${prefixCls}-${strings.SIZE_SMALL}`]: props.size === strings.SIZE_SMALL,
                        [`${prefixCls}-${strings.SIZE_MIDDLE}`]: props.size === strings.SIZE_MIDDLE,
                        [`${prefixCls}-virtualized`]: virtualized,
                        [`${prefixCls}-bordered`]: props.bordered,
                        [`${prefixCls}-fixed-header`]: Boolean(props.scroll?.y),
                    }"
                >
                    <TablePagination v-if="mergedPagination && (paginationPosition === 'top' || paginationPosition === 'both')" :formatPageText="formatPageText" :pagination="mergedPagination" />
                    <div v-if="frame.title" :id="titleId" :class="`${prefixCls}-title`" x-semi-prop="title">
                        <template v-if="typeof frame.title === 'string'">{{ frame.title }}</template>
                        <component :is="node" v-for="[node, key] in frame.title" v-else :key="key" />
                    </div>
                    <div :aria-rowcount="virtualized ? headerRowCount + virtualizedData.length : undefined" :class="`${prefixCls}-container`" :role="splitTable ? 'table' : undefined" v-bind="splitTable ? frame.nameAttrs : {}">
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
                                <div :class="`${prefixCls}-placeholder`">
                                    <div :class="`${prefixCls}-empty`" x-semi-prop="empty">
                                        <slot v-if="$slots.empty" name="empty" />
                                        <template v-else>{{ locale.locale.emptyText }}</template>
                                    </div>
                                </div>
                            </template>
                        </Body>
                        <div v-if="frame.footer" :class="`${prefixCls}-footer`" x-semi-prop="footer">
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
