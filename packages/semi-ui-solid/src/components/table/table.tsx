import { type Accessor, type JSX, Show, children, createEffect, createMemo, createUniqueId, mergeProps, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { strings } from '@fibrae/semi-foundation/components/table/constants';
import TableFoundation, { type BaseColumnProps, type BaseRowKeyType, type TableAdapter, type TableBaseState } from '@fibrae/semi-foundation/components/table/foundation';
import { type FlattenDataProps, amendTableWidth, assignColumnKeys, flattenColumns, flattenData, getCellWidths, getExpandColumn, getHeaderRowCount, getSelectionColumn, mergedRowExpandable, placeInnerColumns } from '@fibrae/semi-foundation/components/table/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import isObject from '@fibrae/semi-foundation/utils/is-object';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/components/table/table.scss';
import useFoundation from '../../base/use-foundation';
import useRaf from '../../primitives/use-raf';
import useResizeObserver from '../../primitives/use-resize-observer';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import mergeStyles from '../../utils/merge-styles';
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

type SelectionConfig = Pick<RowSelectionProps<AnyRecord>, 'class' | 'fixed' | 'width' | 'onCell' | 'onHeaderCell'> & { key: string };

const sameSelectionConfig = (a: SelectionConfig | null, b: SelectionConfig | null) => a === b || (a !== null && b !== null && (Object.keys(a) as (keyof SelectionConfig)[]).every((key) => a[key] === b[key]));

const toFoundationColumns = (columns: ColumnProps[]) => columns as BaseColumnProps<AnyRecord>[];

// a copy, so the keys assignColumnKeys writes and the merged inner columns stay off the user's objects
const copyColumns = (columns: ColumnProps[]): ColumnProps[] => columns.map((column) => (Array.isArray(column.children) && column.children.length ? { ...column, children: copyColumns(column.children) } : { ...column }));

// A user column with the same key overrides the inner column's fields. Sorting and filtering are composed by the header cell from the queries, so they do not rebuild the columns.
function buildColumns(cachedColumns: ColumnProps[], expandColumn: ColumnProps | null, selectionColumn: ColumnProps | null) {
    const columns = placeInnerColumns(copyColumns(cachedColumns), [expandColumn, selectionColumn]);
    assignColumnKeys(columns);
    return columns;
}

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
    const resolvedChildren = children(() => local.children);
    const cachedColumns = createMemo(() => local.columns ?? getColumns(resolvedChildren()));
    const flattened = createMemo(() => flattenColumns(cachedColumns()) as ColumnProps[]);

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
        get flattenColumns() {
            return toFoundationColumns(flattened());
        },
    }) as TableFoundationProps;

    const { foundation, state: foundationState } = useFoundation<TableFoundation<AnyRecord, TableFoundationProps>, TableAdapter<AnyRecord, TableFoundationProps>, TableFoundationProps, TableBaseState<AnyRecord>>(
        TableFoundation,
        foundationProps,
        // initialized in place, so they are copies; the clone keeps the nodes a column holds
        (fprops) => TableFoundation.getInitialState<AnyRecord>(fprops, toFoundationColumns(flattened()), TableFoundation.initColumnsFilteredValueAndSorterOrder<AnyRecord>(cloneDeep(toFoundationColumns(flattened())))),
        (base) => {
            const getRowSelection = () => {
                const selection = rowSelection();
                return isObject(selection) ? selection : undefined;
            };
            return {
                getWrapper: () => wrap,
                getBodyWrapper: () => bodyWrap,
                notifyFilterDropdownVisibleChange: (column, visible) => column.onFilterDropdownVisibleChange?.(visible),
                notifyPageChange: (currentPage, pageSize) => (base.getProp('pagination') as TablePaginationProps | undefined)?.onChange?.(currentPage, pageSize),
                notifyChange: (changeInfo) => base.getProps().onChange?.(changeInfo),
                notifyExpand: (expanded, record, mouseEvent) => base.getProps().onExpand?.(expanded, record as AnyRecord, mouseEvent),
                notifyExpandedRowsChange: (expandedRows) => base.getProps().onExpandedRowsChange?.(expandedRows as AnyRecord[]),
                notifySelect: (record, selected, selectedRows, event) => getRowSelection()?.onSelect?.(record, selected, selectedRows, event),
                notifySelectAll: (selected, selectedRows, changedRows, e) => getRowSelection()?.onSelectAll?.(selected, selectedRows, changedRows, e),
                notifySelectionChange: (selectedRowKeys, selectedRows) => getRowSelection()?.onChange?.(selectedRowKeys, selectedRows),
            };
        }
    );

    const state = foundationState as Accessor<Readonly<TableState>>;

    // reading a JSX expandIcon creates a node, which is dropped; only `false` matters here
    const hasExpandIcon = createMemo(() => local.expandIcon !== false);

    const selectionConfig = createMemo(
        (): SelectionConfig | null => {
            const selection = rowSelection();
            const fields = getSelectionColumn(selection);
            return fields && { ...fields, class: isObject(selection) ? selection.class : undefined };
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
        return statePagination ? { ...statePagination, onChange: foundation.handlePageChange } : null;
    });

    const paginationInfo = createMemo(() => {
        const merged = mergedPagination();
        const formatPageText = (pagination() as TablePaginationProps | undefined)?.formatPageText;
        const pageText = locale().locale.pageText;
        return merged ? untrack(() => TableFoundation.formatPaginationInfo(merged, pageText, formatPageText)) : null;
    });

    const handle: TableHandle = {
        getCurrentPageData: () => cloneDeep(foundation.getCurrentPageData()),
    };

    const ref = untrack(() => props.ref);

    const prefixCls = () => local.prefixCls ?? 'semi-table';

    // the selection checkbox and the expand button render by these keys when the column gives no render or title
    const selectionColumn = createMemo((): ColumnProps | null => {
        const config = selectionConfig();
        return config ? { ...config, class: clsx(config.class, `${prefixCls()}-column-selection`) } : null;
    });

    const expandColumn = createMemo((): ColumnProps | null => {
        const fields = getExpandColumn(local.hideExpandedColumn, local.expandCellFixed);
        return fields && { ...fields, class: `${prefixCls()}-column-expand` };
    });

    const columns = createMemo(() => buildColumns(cachedColumns(), expandColumn(), selectionColumn()));
    const flattenedColumns = createMemo(() => flattenColumns(columns()) as ColumnProps[]);
    const anyColumnFixed = createMemo(() => columns().some((column) => Boolean(column.fixed)));

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
        getCellWidths: (cellColumns) => getCellWidths(state().headWidths, cellColumns, isVirtualized()),
        setHeadWidths: foundation.setHeadWidths,
        setBodyHasScrollbar: foundation.setBodyHasScrollbar,
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

    createEffect(() => warning(Boolean(local.columns) && resolvedChildren.toArray().length > 0, '[Semi Table] columns should not given by object and children at the same time'));

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
