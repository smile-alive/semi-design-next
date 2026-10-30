import { type Accessor, type JSX, Show, children, createComputed, createEffect, createMemo, createUniqueId, mergeProps, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { strings } from '@fibrae/semi-foundation/table/constants';
import TableFoundation, { type BaseColumnProps, type BaseHeadWidth, type BasePageData, type BaseRowKeyType, type TableAdapter, type TableBaseState } from '@fibrae/semi-foundation/table/foundation';
import { type FlattenDataProps, amendTableWidth, assignColumnKeys, flattenColumns, flattenData, getCellWidths, getHeaderRowCount, isMissingDataIndex, mergedRowExpandable, placeInnerColumns } from '@fibrae/semi-foundation/table/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import isObject from '@fibrae/semi-foundation/utils/is-object';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/table/table.scss';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import useFoundation from '../_base/use-foundation';
import useRaf from '../_base/use-raf';
import useResizeObserver from '../_base/use-resize-observer';
import useLocale from '../locale/use-locale';
import Spin from '../spin';
import Body from './body';
import { TableContext, type TableContextValue, type TableFoundationProps, type TableState } from './context';
import getColumns from './get-columns';
import HeadTable from './head-table';
import type { ColumnProps, RowSelectionProps, TableHandle, TablePaginationProps, TableProps } from './interface';
import TablePagination from './table-pagination';
import { cloneDeep, mergeComponents } from './utils';

type AnyRecord = Record<string, any>;

const TABLE_PROP_KEYS = [
    'bordered',
    'children',
    'childrenRecordName',
    'class',
    'clickGroupedRowToExpand',
    'columns',
    'components',
    'dataSource',
    'defaultExpandAllGroupRows',
    'defaultExpandAllRows',
    'defaultExpandedRowKeys',
    'direction',
    'empty',
    'expandAllGroupRows',
    'expandAllRows',
    'expandCellFixed',
    'expandIcon',
    'expandedRowKeys',
    'expandedRowRender',
    'expandRowByClick',
    'footer',
    'getVirtualizedListRef',
    'groupBy',
    'headerStyle',
    'hideExpandedColumn',
    'id',
    'indentSize',
    'keepDOM',
    'loading',
    'pagination',
    'prefixCls',
    'ref',
    'renderGroupSection',
    'renderPagination',
    'resizable',
    'rowExpandable',
    'rowKey',
    'rowSelection',
    'rowSpanHover',
    'scroll',
    'showHeader',
    'size',
    'sticky',
    'style',
    'title',
    'virtualized',
    'onChange',
    'onExpand',
    'onExpandedRowsChange',
    'onGroupedRow',
    'onHeaderRow',
    'onRow',
    'onRowContextMenu',
    'onRowDoubleClick',
    'onRowMouseEnter',
    'onRowMouseLeave',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
] as const satisfies readonly (keyof TableProps)[];

type SelectionConfig = Pick<RowSelectionProps<AnyRecord>, 'class' | 'fixed' | 'width' | 'onCell' | 'onHeaderCell'>;

const sameSelectionConfig = (a: SelectionConfig | null, b: SelectionConfig | null) => a === b || (a !== null && b !== null && (Object.keys(a) as (keyof SelectionConfig)[]).every((key) => a[key] === b[key]));

// the foundation keeps the column objects as given, typed with its own callbacks
const toFoundationColumns = (columns: ColumnProps[]) => columns as BaseColumnProps<AnyRecord>[];

/** A copy of the column tree, so the keys assignColumnKeys writes and the merged inner columns stay off the user's objects */
const copyColumns = (columns: ColumnProps[]): ColumnProps[] => columns.map((column) => (Array.isArray(column.children) && column.children.length ? { ...column, children: copyColumns(column.children) } : { ...column }));

/**
 * The columns with the expand and selection columns added; a user column with the same key overrides their fields.
 * Sorting and filtering are composed by the header cell from the queries, so they do not rebuild the columns.
 */
function buildColumns(cachedColumns: ColumnProps[], expandColumn: ColumnProps | null, selectionColumn: ColumnProps | null) {
    const columns = placeInnerColumns(copyColumns(cachedColumns), [expandColumn, selectionColumn]);
    assignColumnKeys(columns);
    return columns;
}

/** The Table without the global defaults, which the exported Table applies */
export default function NormalTable(props: TableProps) {
    const [local, rest] = splitProps(props, TABLE_PROP_KEYS);

    const locale = useLocale('Table');

    let rootWrap: HTMLDivElement | undefined;
    let wrap: HTMLDivElement | undefined;
    let bodyWrap: HTMLDivElement | undefined;
    let headerWrap: HTMLElement | undefined;
    let lastScrollLeft: number | undefined;

    const scheduleWidthSync = useRaf();

    const titleId = `semi-table-title-${createUniqueId()}`;

    // An inline object or array prop is a new value on every read; the foundation compares these by reference to
    // tell a changed prop, so each is read once per change
    const dataSource = createMemo(() => local.dataSource ?? []);
    const rowSelection = createMemo(() => local.rowSelection);
    const pagination = createMemo(() => local.pagination);
    const expandedRowKeys = createMemo(() => local.expandedRowKeys);

    const foundationProps = mergeProps(props, {
        get dataSource() {
            return dataSource();
        },
        get rowSelection() {
            return rowSelection();
        },
        get pagination() {
            return pagination();
        },
        get expandedRowKeys() {
            return expandedRowKeys();
        },
    }) as TableFoundationProps;

    const resolvedChildren = children(() => local.children);
    const cachedColumns = createMemo(() => local.columns ?? getColumns(resolvedChildren()));
    const flattened = createMemo(() => flattenColumns(cachedColumns()) as ColumnProps[]);

    const { foundation, state: foundationState } = useFoundation<TableFoundation<AnyRecord, TableFoundationProps>, TableAdapter<AnyRecord, TableFoundationProps>, TableFoundationProps, TableBaseState<AnyRecord>>(
        TableFoundation,
        foundationProps,
        // initialized in place, so they are copies; the clone keeps the nodes a column holds
        (fprops) => TableFoundation.getInitialState<AnyRecord>(fprops, toFoundationColumns(flattened()), TableFoundation.initColumnsFilteredValueAndSorterOrder<AnyRecord>(cloneDeep(toFoundationColumns(flattened())))),
        (base) => {
            // the callbacks of the latest rowSelection prop, merged into state
            const getRowSelectionFn = (funcName: string) => {
                const func = get(base.getState('rowSelection'), funcName);
                return typeof func === 'function' ? func : undefined;
            };
            return {
                getScrollMetrics: () => TableFoundation.readScrollMetrics(bodyWrap),
                setScrollableEdges: (edges) => TableFoundation.writeScrollableEdges(bodyWrap, edges),
                resetScrollY: () => {
                    if (local.scroll?.y) {
                        if (bodyWrap) {
                            bodyWrap.scrollTop = 0;
                        }
                    } else {
                        wrap?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                },
                setSelectedRowKeys: (selectedRowKeys) =>
                    base.setState({
                        rowSelection: {
                            ...(base.getState('rowSelection') as AnyRecord),
                            selectedRowKeys: [...selectedRowKeys],
                            selectedRowKeysSet: new Set(selectedRowKeys),
                        },
                    }),
                setPageDisabledRowKeys: (pageDisabledRowKeys) => base.setState({ pageDisabledRowKeys, pageDisabledRowKeysSet: new Set(pageDisabledRowKeys) }),
                setPagination: (nextPagination) => base.setState({ pagination: nextPagination }),
                setGroups: (groups) => base.setState({ groups }),
                setDataSource: (pageDataSource) => base.setState({ dataSource: pageDataSource }),
                setExpandedRowKeys: (keys) => base.setState({ expandedRowKeys: [...keys] }),
                setQueries: (queries) => base.setState({ queries }),
                setAllRowKeys: (allRowKeys) => base.setState({ allRowKeys }),
                setCachedFilteredSortedDataSource: (filteredSortedDataSource) => base.setState({ filteredSortedDataSource }),
                setCachedFilteredSortedRowKeys: (filteredSortedRowKeys) => base.setState({ filteredSortedRowKeys, filteredSortedRowKeysSet: new Set(filteredSortedRowKeys) }),
                setFilteredDisabledRowKeys: (filteredDisabledRowKeys) => base.setState({ filteredDisabledRowKeys, filteredDisabledRowKeysSet: new Set(filteredDisabledRowKeys) }),
                getCurrentPage: () => base.getStates().pagination?.currentPage ?? 1,
                getCachedFilteredSortedDataSource: () => base.getState('filteredSortedDataSource') ?? [],
                getCachedFilteredSortedRowKeys: () => base.getState('filteredSortedRowKeys') ?? [],
                getFilteredDisabledRowKeysSet: () => base.getState('filteredDisabledRowKeysSet') ?? new Set(),
                getHalfCheckedRowKeys: () => base.getState('halfCheckedRowKeys') || [],
                setHalfCheckedRowKeys: (halfCheckedRowKeys) => base.setState({ halfCheckedRowKeys, halfCheckedRowKeysSet: new Set(halfCheckedRowKeys) }),
                getKeyEntities: () => base.getState('keyEntities') || {},
                setKeyEntities: (keyEntities) => base.setState({ keyEntities }),
                getCheckRelation: () => {
                    const selection = base.getState('rowSelection');
                    return selection && typeof selection === 'object' ? (selection.checkRelation ?? 'unRelated') : 'unRelated';
                },
                notifyFilterDropdownVisibleChange: (visible, dataIndex) => {
                    const column = dataIndex ? base.getState('queries')?.find((query) => query.dataIndex === dataIndex) : undefined;
                    column?.onFilterDropdownVisibleChange?.(visible);
                },
                notifyChange: (changeInfo) => base.getProps().onChange?.(changeInfo),
                notifyExpand: (expanded, record, mouseEvent) => base.getProps().onExpand?.(expanded, record as AnyRecord, mouseEvent),
                notifyExpandedRowsChange: (expandedRows) => base.getProps().onExpandedRowsChange?.(expandedRows as AnyRecord[]),
                notifySelect: (record, selected, selectedRows, event) => getRowSelectionFn('onSelect')?.(record, selected, selectedRows, event),
                notifySelectAll: (selected, selectedRows, changedRows, e) => getRowSelectionFn('onSelectAll')?.(selected, selectedRows, changedRows, e),
                notifySelectionChange: (selectedRowKeys, selectedRows) => getRowSelectionFn('onChange')?.(selectedRowKeys, selectedRows),
            };
        }
    );

    const state = foundationState as Accessor<Readonly<TableState>>;

    // reading a JSX expandIcon creates a node, which is dropped; only `false` matters here
    const hasExpandIcon = createMemo(() => local.expandIcon !== false);

    const selectionConfig = createMemo(
        (): SelectionConfig | null => {
            const selection = rowSelection();
            if (!selection || (isObject(selection) && selection.hidden)) {
                return null;
            }
            const options: RowSelectionProps<AnyRecord> = isObject(selection) ? selection : {};
            return { class: options.class, fixed: options.fixed, width: options.width, onCell: options.onCell, onHeaderCell: options.onHeaderCell };
        },
        null,
        { equals: sameSelectionConfig }
    );

    // only whether virtualized is set picks the components; an inline virtualized object is new on every read
    const isVirtualized = createMemo(() => Boolean(local.virtualized));
    const components = createMemo(() => mergeComponents(local.components, isVirtualized()));

    // A function is called again when the data of the page changes; a node is not read again then, since every read of
    // a JSX prop creates a new node
    const titleNode = children(() => {
        const title = local.title;
        if (typeof title !== 'function') {
            return title;
        }
        const pageData = state().dataSource;
        return untrack(() => (title as (data?: AnyRecord[]) => JSX.Element)(pageData));
    });

    const footerNode = children(() => {
        const footer = local.footer;
        if (typeof footer !== 'function') {
            return footer;
        }
        const pageData = state().dataSource;
        return untrack(() => (footer as (data?: AnyRecord[]) => JSX.Element)(pageData));
    });

    const mergedPagination = createMemo((): TablePaginationProps | null => {
        const statePagination = state().pagination as TablePaginationProps | undefined;
        if (!statePagination) {
            return null;
        }
        const userOnChange = statePagination.onChange;
        // the user's onChange replaces setPage, which resets the scroll itself; with scrollToFirstRowOnChange the
        // replacement still resets it
        if (local.scroll?.scrollToFirstRowOnChange && typeof userOnChange === 'function') {
            return {
                ...statePagination,
                onChange: (currentPage: number, pageSize: number) => {
                    foundation.resetScrollY();
                    userOnChange(currentPage, pageSize);
                },
            };
        }
        return { onChange: foundation.setPage, ...statePagination };
    });

    const paginationInfo = createMemo(() => {
        const merged = mergedPagination();
        const formatPageText = (pagination() as TablePaginationProps | undefined)?.formatPageText;
        const pageText = locale().locale.pageText;
        return merged ? untrack(() => TableFoundation.formatPaginationInfo(merged, pageText, formatPageText)) : null;
    });

    // the methods read the state only when called
    const handle: TableHandle = {
        getCurrentPageData: () => {
            const pageData = foundation.getCurrentPageData();
            const result: Pick<BasePageData<AnyRecord>, 'dataSource' | 'groups'> = {};
            if (pageData.dataSource) {
                result.dataSource = pageData.dataSource;
            }
            if (pageData.groups) {
                result.groups = pageData.groups;
            }
            return cloneDeep(result);
        },
    };

    const ref = untrack(() => props.ref);

    // The derived state is written for the foundation, then its update step runs against the previous props, as the
    // class component's componentDidUpdate did
    const snapshot = () => ({ props: { dataSource: dataSource(), rowSelection: rowSelection(), expandAllRows: local.expandAllRows, expandAllGroupRows: local.expandAllGroupRows } as TableFoundationProps, flatten: toFoundationColumns(flattened()) });

    let committed = untrack(snapshot);

    const prefixCls = () => local.prefixCls ?? 'semi-table';

    // the selection checkbox and the expand button render by these keys when the column gives no render or title
    const selectionColumn = createMemo((): ColumnProps | null => {
        const config = selectionConfig();
        return config ? { key: strings.DEFAULT_KEY_COLUMN_SELECTION, fixed: config.fixed, width: config.width, onCell: config.onCell, onHeaderCell: config.onHeaderCell, class: clsx(config.class, `${prefixCls()}-column-selection`) } : null;
    });

    const expandColumn = createMemo((): ColumnProps | null => (local.hideExpandedColumn ? null : { fixed: local.expandCellFixed, key: strings.DEFAULT_KEY_COLUMN_EXPAND, class: `${prefixCls()}-column-expand` }));
    const columns = createMemo(() => buildColumns(cachedColumns(), expandColumn(), selectionColumn()));
    const flattenedColumns = createMemo(() => flattenColumns(columns()) as ColumnProps[]);
    const anyColumnFixed = createMemo(() => columns().some((column) => Boolean(column.fixed)));

    // the header renders as a separate table above the body
    const fixedHeader = () => Boolean(local.scroll?.y) || Boolean(local.sticky);

    const view = createMemo(() => ({
        prefixCls: prefixCls(),
        direction: local.direction,
        anyColumnFixed: anyColumnFixed(),
        // Screen readers associate cells with column headers only within one table: when the header and the body
        // are separate elements, their common container is the table
        splitTable: fixedHeader() || isVirtualized(),
        // a hidden header is inert, so its rows are not rows of the table
        headerRowCount: local.showHeader ? getHeaderRowCount(columns()) : 0,
        components: components(),
        tableLayout: (flattenedColumns().some((column) => Boolean(column.ellipsis) || Boolean(column.fixed)) || fixedHeader() ? 'fixed' : 'auto') as 'fixed' | 'auto',
    }));

    const needSyncTableWidth = () => anyColumnFixed() || (Boolean(local.showHeader) && fixedHeader());

    // the visible title names the table unless the user names it
    const titleNamesTable = () => hasContent(titleNode()) && !local['aria-label'] && !local['aria-labelledby'];

    const tableAria = createMemo(() => ({
        'aria-label': local['aria-label'],
        'aria-labelledby': titleNamesTable() ? titleId : local['aria-labelledby'],
        'aria-describedby': local['aria-describedby'],
    }));

    const paginationPosition = () => ((pagination() as TablePaginationProps | undefined)?.position ?? 'bottom') as string;

    const handleBodyScroll = (e: Event) => {
        const target = e.target;
        if (e.currentTarget !== target || !(target instanceof HTMLElement)) {
            return;
        }
        if (target.scrollLeft !== lastScrollLeft) {
            if (target === bodyWrap && headerWrap) {
                headerWrap.scrollLeft = target.scrollLeft;
            } else if (target === headerWrap && bodyWrap) {
                bodyWrap.scrollLeft = target.scrollLeft;
            }
        }
        lastScrollLeft = target.scrollLeft;
        foundation.syncScrollEdges();
    };

    const setHeadWidths = (widths: BaseHeadWidth[], index = 0) => {
        const prevHeadWidths = foundation.getState('headWidths') ?? [];
        if (!isEqual(prevHeadWidths[index], widths)) {
            const nextHeadWidths = [...prevHeadWidths];
            nextHeadWidths[index] = [...widths];
            foundation.setState({ headWidths: nextHeadWidths });
        }
    };

    const setBodyHasScrollbar = (hasScrollBar: boolean) => {
        if (hasScrollBar !== foundation.getState('bodyHasScrollBar')) {
            foundation.setState({ bodyHasScrollBar: hasScrollBar });
        }
    };

    const rowExpandable = (record: AnyRecord) => mergedRowExpandable(record, { childrenRecordName: local.childrenRecordName ?? 'children', hasExpandedRow: typeof local.expandedRowRender === 'function', rowExpandable: local.rowExpandable });

    // a virtualized table counts all its rows in aria-rowcount, so the rows are flattened here rather than in the body
    const virtualizedData = createMemo(() =>
        isVirtualized()
            ? flattenData(
                  {
                      rowKey: local.rowKey as FlattenDataProps['rowKey'],
                      childrenRecordName: local.childrenRecordName,
                      expandedRowRender: local.expandedRowRender,
                      expandedRowKeys: state().expandedRowKeys,
                      groups: state().groups ?? undefined,
                      rowExpandable,
                  },
                  state().dataSource
              )
            : []
    );

    const contextValue: TableContextValue = {
        view,
        props,
        state,
        foundation,
        flattenedColumns,
        getCellWidths: (cellColumns) => getCellWidths(state().headWidths, cellColumns),
        setHeadWidths,
        setBodyHasScrollbar,
        handleBodyScroll,
        handleRowExpanded: (expanded: boolean, rowKey: BaseRowKeyType, event?: Event) => foundation.handleRowExpanded(expanded, rowKey, event),
        handleRowSelection: (rowKey: BaseRowKeyType, selected: boolean, event: Event) => foundation.handleRowClickSelection(rowKey, selected, event),
        rowExpandable,
        hasExpandIcon,
        tableAria,
        virtualizedData,
    };

    // The wrapper size gives the width of expanded rows and the fixed column shadows. It goes to a CSS variable
    // rather than state: a window drag resizes the table every frame
    const syncTableWidth = () => rootWrap?.style.setProperty('--semi-table-section-width', `${amendTableWidth(rootWrap.getBoundingClientRect().width)}px`);

    const tablePagination = () => <Show when={pagination() ? mergedPagination() : null}>{(merged) => <TablePagination info={paginationInfo()} pagination={merged()} prefixCls={prefixCls()} renderPagination={local.renderPagination} />}</Show>;

    const emptySlot = () => (
        <Show when={!state().dataSource?.length}>
            <div class={`${prefixCls()}-placeholder`}>
                <div class={`${prefixCls()}-empty`} x-semi-prop="empty">
                    {local.empty || locale().locale.emptyText}
                </div>
            </div>
        </Show>
    );

    createComputed(
        on(
            [flattened, dataSource, rowSelection, pagination, expandedRowKeys, () => local.expandAllRows, () => local.expandAllGroupRows],
            () => {
                const changes = TableFoundation.deriveState(foundationProps, foundation.getStates(), toFoundationColumns(flattened()));
                if (changes) {
                    foundation.setState(changes);
                }
                foundation.handleUpdate(committed.props, committed.flatten);
                committed = snapshot();
            },
            { defer: true }
        )
    );

    createEffect(() => warning(Boolean(local.columns) && resolvedChildren.toArray().length > 0, '[Semi Table] columns should not given by object and children at the same time'));
    createEffect(() => warning(flattened().some(isMissingDataIndex), `[Semi Table] The column with sorter or filter must pass the 'dataIndex' prop`));

    useResizeObserver(
        () => (needSyncTableWidth() ? rootWrap : null),
        () => scheduleWidthSync(syncTableWidth)
    );

    createEffect(() => {
        if (needSyncTableWidth()) {
            syncTableWidth();
        }
    });

    useResizeObserver(() => (anyColumnFixed() ? rootWrap : null), foundation.syncScrollEdges);

    // content width changes without a wrapper resize (columns, data) are caught after the update
    createEffect(
        on([columns, () => state().dataSource], () => {
            if (anyColumnFixed()) {
                foundation.syncScrollEdges();
            }
        })
    );

    return (
        <div
            dir={local.direction}
            {...rest}
            ref={(node) => mergeRefs(ref)((rootWrap = Object.assign(node, handle)))}
            id={local.id}
            class={clsx(local.class, `${prefixCls()}-wrapper`)}
            style={isVirtualized() ? mergeStyles({ width: toCssLength(local.scroll?.x) }, local.style) : local.style}
            data-column-fixed={String(anyColumnFixed())}
        >
            <TableContext.Provider value={contextValue}>
                <Spin size="large" spinning={local.loading}>
                    <div
                        ref={(node) => (wrap = node)}
                        class={clsx({
                            [`${prefixCls()}-${strings.SIZE_SMALL}`]: local.size === strings.SIZE_SMALL,
                            [`${prefixCls()}-${strings.SIZE_MIDDLE}`]: local.size === strings.SIZE_MIDDLE,
                            [`${prefixCls()}-bordered`]: Boolean(local.bordered),
                            [`${prefixCls()}-virtualized`]: isVirtualized(),
                            [`${prefixCls()}-fixed-header`]: Boolean(local.scroll?.y),
                        })}
                    >
                        <Show when={['top', 'both'].includes(paginationPosition())}>{tablePagination()}</Show>
                        <Show when={hasContent(titleNode())}>
                            <div id={titleNamesTable() ? titleId : undefined} class={`${prefixCls()}-title`} x-semi-prop="title">
                                {titleNode()}
                            </div>
                        </Show>
                        <div class={`${prefixCls()}-container`} aria-rowcount={isVirtualized() ? view().headerRowCount + virtualizedData().length : undefined} role={view().splitTable ? 'table' : undefined} {...(view().splitTable ? tableAria() : {})}>
                            <Show when={fixedHeader()}>
                                <HeadTable ref={(node) => (headerWrap = node)} columns={columns()} />
                            </Show>
                            <Body ref={(node) => (bodyWrap = node)} columns={columns()} emptySlot={emptySlot()} headerRef={(node) => (headerWrap = node)} includeHeader={!fixedHeader()} />
                            <Show when={hasContent(footerNode())}>
                                <div class={`${prefixCls()}-footer`} x-semi-prop="footer">
                                    {footerNode()}
                                </div>
                            </Show>
                        </div>
                        <Show when={['bottom', 'both'].includes(paginationPosition())}>{tablePagination()}</Show>
                    </div>
                </Spin>
            </TableContext.Provider>
        </div>
    );
}
