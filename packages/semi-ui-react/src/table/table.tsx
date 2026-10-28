import React, { type ReactNode, isValidElement, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { isEqual, omit } from 'es-toolkit';
// compat get resolves deep paths such as 'pagination.currentPage'
import { get } from 'es-toolkit/compat';
import { strings } from '@fibrae/semi-foundation/table/constants';
import TableFoundation, { type TableAdapter, type TableBaseState, type BasePageData, type BaseRowKeyType, type BaseHeadWidth } from '@fibrae/semi-foundation/table/foundation';
import { type FlattenData, type GroupFlattenData, amendTableWidth, assignColumnKeys, flattenColumns, flattenData, getCellWidths, getHeaderRowCount, isMissingDataIndex, mergedRowExpandable, placeInnerColumns, shouldShowEllipsisTitle } from '@fibrae/semi-foundation/table/utils';
import { noop } from '@fibrae/semi-foundation/utils/function';
import isObject from '@fibrae/semi-foundation/utils/is-object';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/table/table.scss';
import { createContext } from '../_base/create-context';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import LocaleConsumer from '../locale/locale-consumer';
import useLocale from '../locale/use-locale';
import Spin from '../spin';
import BodyTable from './body';
import ColumnFilter, { type OnSelectData } from './column-filter';
import ColumnSelection from './column-selection';
import ColumnSorter from './column-sorter';
import ExpandedIcon from './custom-expand-icon';
import getColumns from './get-columns';
import HeadTable from './head-table';
import type { ColumnProps, TablePaginationProps, BodyScrollEvent, ColumnTitleProps, ExpandIcon, RowKey, TableLocale, TableProps, RowSelectionProps, Data } from './interface';
import { TableContext, type TableContextProps } from './table-context';
import type { HeaderColumn } from './table-header-row';
import TablePagination from './table-pagination';
import { cloneDeep, mergeComponents } from './utils';

export type NormalTableProps<RecordType extends Record<string, any> = Data> = Omit<TableProps<RecordType>, 'resizable'>;

export interface NormalTableState<RecordType extends Record<string, any> = Data> extends TableBaseState<RecordType> {
    flattenColumns?: ColumnProps<RecordType>[];
    queries?: ColumnProps<RecordType>[];
    rowSelection?: TableStateRowSelection<RecordType>;
}

export type TableStateRowSelection<RecordType extends Record<string, any> = Data> = (RowSelectionProps<RecordType> & { selectedRowKeysSet?: Set<string | number> }) | null;

// read-only: shared across renders so the empty default keeps a stable reference
const EMPTY_KEY_SET: Set<string | number> = new Set();
const EMPTY_FLATTEN_DATA: Array<FlattenData | GroupFlattenData> = [];

function resolveColumns(columns: ColumnProps[], children: ReactNode) {
    return columns ? columns : getColumns(children);
}

function getInitialState<RecordType extends Record<string, any>>(props: NormalTableProps<RecordType>): NormalTableState<RecordType> {
    // columns cannot be deepClone, otherwise the comparison will be false
    const flattened = flattenColumns(resolveColumns(props.columns, props.children));
    // initialized in place, so they are copies; the clone keeps the React elements a column holds
    const queries = TableFoundation.initColumnsFilteredValueAndSorterOrder<RecordType, ColumnProps<RecordType>>(cloneDeep(flattened));
    return TableFoundation.getInitialState(props, flattened, queries);
}

interface TableRowStateContextValue {
    rowSelection: TableStateRowSelection<any>;
    filteredDisabledRowKeysSet: Set<BaseRowKeyType>;
    halfCheckedRowKeysSet: Set<BaseRowKeyType>;
    filteredSortedRowKeys: BaseRowKeyType[];
    filteredSortedRowKeysSet: Set<BaseRowKeyType>;
    expandedRowKeys: (string | number)[];
    expandIcon: ExpandIcon;
    rowKey: RowKey<any>;
    foundation: TableFoundation<any>;
}

/**
 * The selection and expansion state that checkboxes and expand icons read. The column render functions that place
 * them stay stable, so a click re-renders only these cells instead of every cell of the table.
 */
const [TableRowStateContext, useTableRowStateContext] = createContext<TableRowStateContextValue>('Table');

function TableSelection({ record, inHeader, index }: { record?: any; inHeader?: boolean; index?: number }) {
    const { rowSelection, filteredDisabledRowKeysSet, halfCheckedRowKeysSet, filteredSortedRowKeys, filteredSortedRowKeysSet, rowKey, foundation } = useTableRowStateContext('Table');
    const { locale } = useLocale('Table');

    if (!rowSelection || typeof rowSelection !== 'object') {
        return null;
    }

    const { selectedRowKeys = [], selectedRowKeysSet = new Set(), getCheckboxProps, disabled, renderCell, checkRelation = 'unRelated' } = rowSelection;
    const allIsSelected = TableFoundation.allIsSelected(selectedRowKeysSet, filteredDisabledRowKeysSet, filteredSortedRowKeys);
    const hasRowSelected = TableFoundation.hasRowSelected(selectedRowKeys, filteredSortedRowKeysSet);
    const indeterminate = hasRowSelected && !allIsSelected;

    if (inHeader) {
        const selectAll = (selected: boolean, e: any) => foundation.handleSelectAllRow(selected, e);
        const originNode = <ColumnSelection aria-label={locale.selectAllRows} disabled={disabled} indeterminate={indeterminate} selected={allIsSelected} onChange={selectAll} />;

        return typeof renderCell === 'function'
            ? renderCell({
                  selected: allIsSelected,
                  record,
                  originNode,
                  inHeader,
                  disabled,
                  indeterminate,
                  selectAll,
              })
            : originNode;
    }

    const key = TableFoundation.getRecordKey({ rowKey }, record);
    const selected = selectedRowKeysSet.has(key);
    const halfChecked = checkRelation === 'related' && halfCheckedRowKeysSet && halfCheckedRowKeysSet.has(key);

    const selectRow = (rowSelected: boolean, e: any) => foundation.handleSelectRow(key, rowSelected, e);

    const originNode = <ColumnSelection aria-label={locale.selectRow} getCheckboxProps={() => (typeof getCheckboxProps === 'function' ? getCheckboxProps(record) : {})} indeterminate={halfChecked} selected={selected} onChange={selectRow} />;

    return typeof renderCell === 'function'
        ? renderCell({
              selected,
              record,
              index,
              originNode,
              inHeader: false,
              disabled,
              indeterminate: halfChecked,
              selectRow,
          })
        : originNode;
}

function TableExpandIcon({ record, isNested, groupKey }: { record: any; isNested: boolean; groupKey: string | number }) {
    const { expandedRowKeys, expandIcon, rowKey, foundation } = useTableRowStateContext('Table');

    const key = typeof groupKey === 'string' || typeof groupKey === 'number' ? groupKey : TableFoundation.getRecordKey({ rowKey }, record);

    return <ExpandedIcon componentType={isNested ? 'tree' : 'expand'} expanded={expandedRowKeys?.includes(key) ?? false} expandIcon={expandIcon} onClick={(expanded, e) => foundation.handleRowExpanded(expanded, key, e)} />;
}

function TableExpandColumnTitle({ prefixCls }: { prefixCls: string }) {
    const { locale } = useLocale('Table');

    return <span className={`${prefixCls}-column-expand-title`}>{locale.expandColumn}</span>;
}

function renderSelection(record: any = {}, inHeader = false, index?: number) {
    return <TableSelection index={index} inHeader={inHeader} record={record} />;
}

// the key keeps the icon apart from its siblings when a column render puts it in an array
function renderExpandIcon(record: any = {}, isNested = false, groupKey: string | number = null) {
    return <TableExpandIcon key="expandIcon" groupKey={groupKey} isNested={isNested} record={record} />;
}

/**
 * Add sorting, filtering, and rendering functions to columns, and add column event handling
 * A title function gets the sorter and filter nodes only with useFullRender; otherwise its result is the title
 */
function addFnsInColumn(column: HeaderColumn = {}, queries: ColumnProps[], prefixCls: string, foundation: TableFoundation<any>) {
    const hasFilter = (Array.isArray(column?.filters) && column.filters.length > 0) || isValidElement(column?.filterDropdown) || typeof column?.renderFilterDropdown === 'function';
    if (column && (column.sorter || column.filters || column.onFilter || column.useFullRender || hasFilter)) {
        const hasSorter = typeof column.sorter === 'function' || column.sorter === true;
        let hasSorterOrFilter = false;
        // the same test as the foundation's controlled sorter
        const sortOrderNotControlled = column.sortOrder == null;
        const showSortTip = sortOrderNotControlled && column.showSortTip === true;
        const { dataIndex, title: rawTitle, useFullRender } = column;
        const clickColumnToSorter = hasSorter && !hasFilter && !useFullRender;
        const { query: curQuery, sortOrder, filteredValue } = TableFoundation.getColumnQueryState(column, queries);
        const titleMap: ColumnTitleProps = {};
        const titleArr = [];

        if (useFullRender) {
            titleMap.selection = renderSelection(null, true);
        }

        const showEllipsisTitle = shouldShowEllipsisTitle(column.ellipsis);
        const titleFnGetsParts = typeof rawTitle === 'function' && useFullRender;
        const titleContent = typeof rawTitle === 'function' ? (titleFnGetsParts ? null : rawTitle({})) : rawTitle;
        const TitleNode = !titleFnGetsParts && (
            <span key={strings.DEFAULT_KEY_COLUMN_TITLE} className={`${prefixCls}-row-head-title`} title={showEllipsisTitle && typeof titleContent === 'string' ? titleContent : undefined}>
                {titleContent}
            </span>
        );
        if (hasSorter) {
            // Without useFullRender, the whole title is the sort click target to enlarge the hit area
            const sorter = <ColumnSorter key={strings.DEFAULT_KEY_COLUMN_SORTER} title={TitleNode} showTooltip={!clickColumnToSorter && showSortTip} sortIcon={column.sortIcon} sortOrder={sortOrder} onClick={useFullRender || hasFilter ? () => foundation.handleSort(column) : null} />;
            if (useFullRender) {
                titleMap.sorter = sorter;
            }
            hasSorterOrFilter = true;
            titleArr.push(sorter);
        } else {
            titleArr.push(TitleNode);
        }

        if (hasFilter) {
            // A column without dataIndex has no query: its own options configure the menu
            const filterQuery = curQuery ?? column;
            const filter = (
                <ColumnFilter
                    // The jsx runtime wants key passed on its own; a column key still wins as it did when spread
                    key={filterQuery.key ?? strings.DEFAULT_KEY_COLUMN_FILTER}
                    {...omit(filterQuery, ['children', 'key'])}
                    filteredValue={filteredValue}
                    onFilterDropdownVisibleChange={(visible: boolean) => foundation.toggleShowFilter(dataIndex, visible)}
                    onSelect={(data: OnSelectData) => foundation.handleFilterSelect(dataIndex, data)}
                />
            );
            if (useFullRender) {
                titleMap.filter = filter;
            }
            hasSorterOrFilter = true;
            titleArr.push(filter);
        }

        const newTitle = titleFnGetsParts ? () => rawTitle(titleMap) : hasSorterOrFilter ? <div className={`${prefixCls}-operate-wrapper`}>{titleArr}</div> : titleArr;

        column = { ...column, title: newTitle };
        if (hasSorter) {
            // the header cell shows it as aria-sort
            column.sortOrder = sortOrder;
        }
        if (clickColumnToSorter) {
            column.clickToSort = () => {
                foundation.handleSort(column);
            };
            column.showSortTip = showSortTip;
        }
    }

    return column;
}

/**
 * The columns with sorters, filters, the expand column and the selection column added
 */
function buildColumns(queries: ColumnProps[], cachedColumns: ColumnProps[], prefixCls: string, foundation: TableFoundation<any>, expandColumn: ColumnProps | null, selectionColumn: ColumnProps | null) {
    const childrenColumnName = 'children';
    let columns: ColumnProps[] = cloneDeep(cachedColumns);

    const addFns = (cols: ColumnProps[] = []) => {
        if (Array.isArray(cols) && cols.length) {
            cols.forEach((column, index, originColumns) => {
                const newColumn = addFnsInColumn(column, queries, prefixCls, foundation);
                const children = column[childrenColumnName];
                if (Array.isArray(children) && children.length) {
                    const newChildren = [...children];
                    addFns(newChildren);
                    newColumn[childrenColumnName] = newChildren;
                }
                originColumns[index] = newColumn;
            });
        }
    };

    addFns(columns);

    columns = placeInnerColumns(columns, [expandColumn, selectionColumn]);

    assignColumnKeys(columns);

    return columns;
}

// ReactNode includes numbers (0 too) and arrays; null, undefined and booleans render nothing
const hasContent = (node: ReactNode) => node != null && typeof node !== 'boolean';

function syncTableWidth(wrapper: HTMLElement | null) {
    wrapper?.style.setProperty('--semi-table-section-width', `${amendTableWidth(wrapper.getBoundingClientRect().width)}px`);
}

export default function Table<RecordType extends Record<string, any>>(props: NormalTableProps<RecordType>) {
    const {
        ref,
        scroll,
        prefixCls,
        className,
        style,
        bordered,
        id,
        pagination: propPagination,
        virtualized,
        size,
        renderPagination,
        getVirtualizedListRef,
        loading,
        hideExpandedColumn,
        rowSelection: propRowSelection,
        columns: propColumns,
        children,
        components: propComponents,
        dataSource: propDataSource,
        title,
        footer,
        empty,
        showHeader,
        sticky,
        expandIcon,
        expandCellFixed,
        expandedRowRender,
        expandRowByClick,
        childrenRecordName,
        rowExpandable,
        rowKey,
        onRow,
        onRowContextMenu,
        onRowDoubleClick,
        onRowMouseEnter,
        onRowMouseLeave,
        onHeaderRow,
        indentSize,
        keepDOM,
        renderGroupSection,
        onGroupedRow,
        clickGroupedRowToExpand,
        headerStyle,
        rowSpanHover,
        direction,
        groupBy,
        expandAllRows,
        expandAllGroupRows,
        defaultExpandAllRows,
        defaultExpandAllGroupRows,
        defaultExpandedRowKeys,
        expandedRowKeys: propExpandedRowKeys,
        onChange,
        onExpand,
        onExpandedRowsChange,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        ...rest
    } = props;

    const titleId = useId();
    const rootWrapRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const bodyWrapRef = useRef<HTMLDivElement>(null);
    const headerWrapRef = useRef<HTMLElement>(null);
    const lastScrollLeft = useRef<number>(undefined);
    const widthFrameRef = useRef(0);

    // The derived state is written back for the foundation, which reads state in events; then the class component's
    // componentDidUpdate runs against the previous commit
    const committed = useRef<{ props: NormalTableProps<RecordType>; view: NormalTableState<RecordType> }>(null);

    const [foundation, state] = useFoundation<TableFoundation<RecordType, NormalTableProps<RecordType>, NormalTableState<RecordType>>, TableAdapter<RecordType, NormalTableProps<RecordType>, NormalTableState<RecordType>>, NormalTableProps<RecordType>, NormalTableState<RecordType>>(
        TableFoundation,
        props,
        () => getInitialState(props),
        (base) => {
            // the callbacks of the latest rowSelection prop, merged into state
            const getRowSelectionFn = (funcName: string) => {
                const func = get(base.getState('rowSelection'), funcName);
                return typeof func === 'function' ? func : noop;
            };
            return {
                resetScrollY: () => {
                    if (base.getProp('scroll')?.y) {
                        if (bodyWrapRef.current) {
                            bodyWrapRef.current.scrollTop = 0;
                        }
                    } else if (wrapRef.current) {
                        wrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                },
                getScrollMetrics: () => TableFoundation.readScrollMetrics(bodyWrapRef.current),
                setScrollableEdges: (edges) => TableFoundation.writeScrollableEdges(bodyWrapRef.current, edges),
                setSelectedRowKeys: (selectedRowKeys) =>
                    base.setState({
                        rowSelection: {
                            ...(base.getState('rowSelection') as Record<string, any>),
                            selectedRowKeys: [...selectedRowKeys],
                            selectedRowKeysSet: new Set(selectedRowKeys),
                        },
                    }),
                setPageDisabledRowKeys: (pageDisabledRowKeys) => base.setState({ pageDisabledRowKeys, pageDisabledRowKeysSet: new Set(pageDisabledRowKeys) }),
                setPagination: (pagination) => base.setState({ pagination }),
                setGroups: (groups) => base.setState({ groups }),
                setDataSource: (dataSource) => base.setState({ dataSource }),
                setExpandedRowKeys: (expandedRowKeys) => base.setState({ expandedRowKeys: [...expandedRowKeys] }),
                setQueries: (queries: ColumnProps<RecordType>[]) => base.setState({ queries }),
                setAllRowKeys: (allRowKeys) => base.setState({ allRowKeys }),
                setCachedFilteredSortedDataSource: (filteredSortedDataSource) => base.setState({ filteredSortedDataSource }),
                setCachedFilteredSortedRowKeys: (filteredSortedRowKeys) =>
                    base.setState({
                        filteredSortedRowKeys,
                        filteredSortedRowKeysSet: new Set(filteredSortedRowKeys),
                    }),
                setFilteredDisabledRowKeys: (filteredDisabledRowKeys) =>
                    base.setState({
                        filteredDisabledRowKeys,
                        filteredDisabledRowKeysSet: new Set(filteredDisabledRowKeys),
                    }),
                getCurrentPage: () => get(base.getStates(), 'pagination.currentPage', 1),
                getCachedFilteredSortedDataSource: () => base.getState('filteredSortedDataSource'),
                getCachedFilteredSortedRowKeys: () => base.getState('filteredSortedRowKeys'),
                getFilteredDisabledRowKeysSet: () => base.getState('filteredDisabledRowKeysSet'),
                getHalfCheckedRowKeys: () => base.getState('halfCheckedRowKeys') || [],
                setHalfCheckedRowKeys: (halfCheckedRowKeys) => base.setState({ halfCheckedRowKeys, halfCheckedRowKeysSet: new Set(halfCheckedRowKeys) }),
                getKeyEntities: () => base.getState('keyEntities') || {},
                setKeyEntities: (keyEntities) => base.setState({ keyEntities }),
                getCheckRelation: () => {
                    const rowSelection = base.getState('rowSelection');
                    if (rowSelection && typeof rowSelection === 'object') {
                        return rowSelection.checkRelation ?? 'unRelated';
                    }
                    return 'unRelated';
                },
                notifyFilterDropdownVisibleChange: (visible, dataIndex) => {
                    const column = dataIndex && base.getState('queries')?.find((query) => query.dataIndex === dataIndex);
                    const func = column?.onFilterDropdownVisibleChange;
                    if (typeof func === 'function') {
                        func(visible);
                    }
                },
                notifyChange: (changeInfo) => base.getProps().onChange(changeInfo),
                notifyExpand: (expanded, record, mouseEvent) => base.getProps().onExpand(expanded, record, mouseEvent),
                notifyExpandedRowsChange: (expandedRows) => base.getProps().onExpandedRowsChange(expandedRows),
                notifySelect: (record, selected, selectedRows, event) => getRowSelectionFn('onSelect')(record, selected, selectedRows, event),
                notifySelectAll: (selected, selectedRows, changedRows, e) => getRowSelectionFn('onSelectAll')(selected, selectedRows, changedRows, e),
                notifySelectionChange: (selectedRowKeys, selectedRows) => getRowSelectionFn('onChange')(selectedRowKeys, selectedRows),
            };
        }
    );

    const cachedColumns = useMemo(() => resolveColumns(propColumns, children), [propColumns, children]);
    const flattened = useMemo(() => flattenColumns(cachedColumns), [cachedColumns]);
    const derived = TableFoundation.deriveState(props, state, flattened);
    const view: NormalTableState<RecordType> = derived ? { ...state, ...derived } : state;
    const { queries, rowSelection, pagination, expandedRowKeys, headWidths, bodyHasScrollBar } = view;
    const bothColumnsGiven = Boolean(propColumns && children);
    const missingDataIndex = flattened.some(isMissingDataIndex);

    // the header renders as a separate table above the body
    const fixedHeader = Boolean(scroll?.y) || Boolean(sticky);
    const hasExpandIcon = expandIcon !== false;
    const showSelection = Boolean(propRowSelection) && !(propRowSelection as RowSelectionProps<RecordType>)?.hidden;
    const { className: selectionClassName, fixed: selectionFixed, width: selectionWidth, onCell: selectionOnCell, onHeaderCell: selectionOnHeaderCell, shouldCellUpdate: selectionShouldCellUpdate } = isObject(propRowSelection) ? propRowSelection : {};

    const selectionColumn = useMemo<ColumnProps | null>(
        () =>
            showSelection
                ? {
                      key: strings.DEFAULT_KEY_COLUMN_SELECTION,
                      fixed: selectionFixed,
                      width: selectionWidth,
                      onCell: selectionOnCell,
                      onHeaderCell: selectionOnHeaderCell,
                      shouldCellUpdate: selectionShouldCellUpdate,
                      className: clsx(selectionClassName, `${prefixCls}-column-selection`),
                      title: () => renderSelection(undefined, true),
                      render: (_text: any, record: RecordType, index: number) => renderSelection(record, false, index),
                  }
                : null,
        [showSelection, selectionFixed, selectionWidth, selectionOnCell, selectionOnHeaderCell, selectionShouldCellUpdate, selectionClassName, prefixCls]
    );

    // only whether virtualized is set picks the components; an inline virtualized object is new on every render
    const isVirtualized = Boolean(virtualized);
    const components = useMemo(() => mergeComponents(propComponents, isVirtualized), [propComponents, isVirtualized]);

    // Screen readers associate cells with column headers only within one table: when the header and the body are
    // separate elements, their common container is the table
    const splitTable = fixedHeader || Boolean(virtualized);
    const titleNode = typeof title === 'function' ? title(view.dataSource) : title;

    // the visible title names the table unless the user names it
    const titleNamesTable = hasContent(titleNode) && !ariaLabel && !ariaLabelledby;

    const tableAria = useMemo(
        () => ({
            'aria-label': ariaLabel,
            'aria-labelledby': titleNamesTable ? titleId : ariaLabelledby,
            'aria-describedby': ariaDescribedby,
        }),
        [ariaLabel, ariaLabelledby, ariaDescribedby, titleNamesTable, titleId]
    );

    const mergedPagination = useMemo(() => {
        if (!pagination) {
            return null;
        }
        const userOnChange = (pagination as TablePaginationProps)?.onChange;
        // the user's onChange replaces setPage, which resets the scroll itself; with scrollToFirstRowOnChange the
        // replacement still resets it
        if (scroll?.scrollToFirstRowOnChange && typeof userOnChange === 'function') {
            return {
                ...(pagination as TablePaginationProps),
                onChange: (currentPage: number, pageSize: number) => {
                    foundation.resetScrollY();
                    userOnChange(currentPage, pageSize);
                },
            };
        }
        return { onChange: foundation.setPage, ...(pagination as TablePaginationProps) };
    }, [pagination, scroll?.scrollToFirstRowOnChange, foundation]);

    const rowStateContextValue = useMemo<TableRowStateContextValue>(
        () => ({
            rowSelection,
            filteredDisabledRowKeysSet: view.filteredDisabledRowKeysSet,
            halfCheckedRowKeysSet: view.halfCheckedRowKeysSet,
            filteredSortedRowKeys: view.filteredSortedRowKeys,
            filteredSortedRowKeysSet: view.filteredSortedRowKeysSet,
            expandedRowKeys,
            expandIcon,
            rowKey,
            foundation,
        }),
        [rowSelection, view.filteredDisabledRowKeysSet, view.halfCheckedRowKeysSet, view.filteredSortedRowKeys, view.filteredSortedRowKeysSet, expandedRowKeys, expandIcon, rowKey, foundation]
    );

    const dataSource = view.dataSource;
    const selectedRowKeysSet = rowSelection?.selectedRowKeysSet ?? EMPTY_KEY_SET;
    const wrapStyle = { ...style };

    const handleBodyScroll = useCallback(
        (e: BodyScrollEvent) => {
            if (e.currentTarget !== e.target) {
                return;
            }
            const { target } = e;
            const headTable = headerWrapRef.current;
            const bodyTable = bodyWrapRef.current;
            if (target.scrollLeft !== lastScrollLeft.current) {
                if (target === bodyTable && headTable) {
                    headTable.scrollLeft = target.scrollLeft;
                } else if (target === headTable && bodyTable) {
                    bodyTable.scrollLeft = target.scrollLeft;
                }
            }
            lastScrollLeft.current = target.scrollLeft;
            foundation.syncScrollEdges();
        },
        [foundation]
    );

    const setHeadWidths = useCallback(
        (widths: BaseHeadWidth[], index = 0) => {
            const prevHeadWidths: BaseHeadWidth[][] = foundation.getState('headWidths');
            if (!isEqual(prevHeadWidths[index], widths)) {
                const nextHeadWidths = [...prevHeadWidths];
                nextHeadWidths[index] = [...widths];
                foundation.setState({ headWidths: nextHeadWidths });
            }
        },
        [foundation]
    );

    const cellWidthsOf = useCallback((flattenedColumns: ColumnProps<RecordType>[]) => getCellWidths(headWidths, flattenedColumns), [headWidths]);

    const setBodyHasScrollbar = useCallback(
        (hasScrollBar: boolean) => {
            if (hasScrollBar !== foundation.getState('bodyHasScrollBar')) {
                foundation.setState({ bodyHasScrollBar: hasScrollBar });
            }
        },
        [foundation]
    );

    const handleRowExpanded = useCallback((expanded: boolean, key: BaseRowKeyType, e: React.MouseEvent<HTMLElement>) => foundation.handleRowExpanded(expanded, key, e), [foundation]);

    const handleRowSelection = useCallback((key: BaseRowKeyType, selected: boolean, e: React.MouseEvent) => foundation.handleRowClickSelection(key, selected, e), [foundation]);

    const rowExpandableOf = useCallback((record: RecordType) => mergedRowExpandable(record, { childrenRecordName, hasExpandedRow: typeof expandedRowRender === 'function', rowExpandable }), [childrenRecordName, expandedRowRender, rowExpandable]);

    const expandColumn = useMemo<ColumnProps | null>(
        () =>
            hideExpandedColumn
                ? null
                : {
                      fixed: expandCellFixed,
                      key: strings.DEFAULT_KEY_COLUMN_EXPAND,
                      className: clsx(`${prefixCls}-column-expand`),
                      title: <TableExpandColumnTitle prefixCls={prefixCls} />,
                      render: hasExpandIcon ? (_text: any, record: RecordType) => (rowExpandableOf(record) ? renderExpandIcon(record) : null) : () => null,
                  },
        [hideExpandedColumn, expandCellFixed, prefixCls, hasExpandIcon, rowExpandableOf]
    );

    /**
     * Recomputed when the queries change (sorting, filtering, new columns) or the expand and selection columns
     * change; the selection and expand icons inside follow TableRowStateContext without a new columns array
     */
    const columns = useMemo(() => buildColumns(queries, cachedColumns, prefixCls, foundation, expandColumn, selectionColumn), [queries, cachedColumns, prefixCls, foundation, expandColumn, selectionColumn]);
    const flattenFnsColumns = useMemo(() => flattenColumns(columns), [columns]);
    const anyColumnFixed = columns.some((column) => Boolean(column.fixed));
    const needSyncTableWidth = anyColumnFixed || (showHeader && fixedHeader);

    // a virtualized table counts all its rows in aria-rowcount, so the rows are flattened here rather than in the body
    const virtualizedData = useMemo(
        () => (virtualized ? flattenData({ rowKey, childrenRecordName, expandedRowRender, expandedRowKeys, groups: view.groups, rowExpandable: rowExpandableOf }, view.dataSource) : EMPTY_FLATTEN_DATA),
        [virtualized, rowKey, childrenRecordName, expandedRowRender, expandedRowKeys, view.groups, view.dataSource, rowExpandableOf]
    );

    // a hidden header is inert, so its rows are not rows of the table
    const headerRowCount = showHeader ? getHeaderRowCount(columns) : 0;

    const tableContextValue = useMemo<TableContextProps>(
        () => ({
            anyColumnFixed,
            flattenedColumns: flattenFnsColumns,
            renderExpandIcon,
            renderSelection,
            setHeadWidths,
            getCellWidths: cellWidthsOf,
            headWidths,
            handleRowExpanded,
            getVirtualizedListRef,
            setBodyHasScrollbar,
            direction,
            handleRowSelection,
            headerStyle,
            rowSpanHover,
            splitTable,
            tableAria,
            headerRowCount,
        }),
        [anyColumnFixed, flattenFnsColumns, setHeadWidths, cellWidthsOf, headWidths, handleRowExpanded, getVirtualizedListRef, setBodyHasScrollbar, direction, handleRowSelection, headerStyle, rowSpanHover, splitTable, tableAria, headerRowCount]
    );

    const tableLayout = flattenFnsColumns.some((column) => Boolean(column.ellipsis) || Boolean(column.fixed)) || fixedHeader ? 'fixed' : 'auto';

    useLayoutEffect(() => {
        if (derived) {
            foundation.setState(derived);
        }
        const prev = committed.current;
        committed.current = { props, view };
        if (prev) {
            foundation.handleUpdate(prev.props, prev.view.flattenColumns);
        }
    });

    // content width changes without a wrapper resize (columns, data) are caught by the commit
    useLayoutEffect(() => {
        if (anyColumnFixed) {
            foundation.syncScrollEdges();
        }
    });

    useResizeObserver(rootWrapRef, () => foundation.syncScrollEdges(), { enabled: anyColumnFixed });

    useEffect(() => {
        warning(bothColumnsGiven, '[Semi Table] columns should not given by object and children at the same time');
    }, [bothColumnsGiven]);

    useEffect(() => {
        warning(missingDataIndex, `[Semi Table] The column with sorter or filter must pass the 'dataIndex' prop`);
    }, [missingDataIndex]);

    // The wrapper size gives the width of section and expanded rows and the fixed column shadows. The width goes to a
    // CSS variable rather than state: a window drag resizes the table every frame, and a state update re-rendered every
    // cell each time
    useResizeObserver(
        rootWrapRef,
        () => {
            window.cancelAnimationFrame(widthFrameRef.current);
            widthFrameRef.current = window.requestAnimationFrame(() => syncTableWidth(rootWrapRef.current));
        },
        { enabled: needSyncTableWidth }
    );

    useLayoutEffect(() => {
        if (!needSyncTableWidth) {
            return undefined;
        }
        syncTableWidth(rootWrapRef.current);
        return () => window.cancelAnimationFrame(widthFrameRef.current);
    }, [needSyncTableWidth]);

    useImperativeHandle(
        ref,
        () => ({
            getCurrentPageData: () => {
                const pageData = foundation.getCurrentPageData();
                const retObj: Pick<BasePageData<RecordType>, 'dataSource' | 'groups'> = {};
                if (pageData.dataSource) {
                    retObj.dataSource = pageData.dataSource;
                }
                if (pageData.groups) {
                    retObj.groups = pageData.groups;
                }
                return cloneDeep(retObj);
            },
        }),
        [foundation]
    );

    if (virtualized && wrapStyle.width == null) {
        wrapStyle.width = scroll?.x;
    }

    const wrapCls = clsx({
        [`${prefixCls}-${strings.SIZE_SMALL}`]: size === strings.SIZE_SMALL,
        [`${prefixCls}-${strings.SIZE_MIDDLE}`]: size === strings.SIZE_MIDDLE,
        [`${prefixCls}-virtualized`]: Boolean(virtualized),
        [`${prefixCls}-bordered`]: bordered,
        [`${prefixCls}-fixed-header`]: Boolean(scroll?.y),
    });

    const tablePagination =
        mergedPagination && propPagination ? (
            <LocaleConsumer componentName="Table">{(locale: TableLocale) => <TablePagination info={TableFoundation.formatPaginationInfo(mergedPagination, locale.pageText, (propPagination as TablePaginationProps)?.formatPageText)} pagination={mergedPagination} renderPagination={renderPagination} />}</LocaleConsumer>
        ) : null;

    const paginationPosition = get(propPagination, 'position', 'bottom');
    const footerNode = typeof footer === 'function' ? footer(dataSource) : footer;

    const emptySlot =
        Array.isArray(dataSource) && dataSource.length > 0 ? null : (
            <LocaleConsumer key="emptyText" componentName="Table">
                {(locale: TableLocale) => (
                    <div className={`${prefixCls}-placeholder`}>
                        <div className={`${prefixCls}-empty`} x-semi-prop="empty">
                            {empty || locale.emptyText}
                        </div>
                    </div>
                )}
            </LocaleConsumer>
        );

    return (
        <div dir={direction} {...rest} ref={rootWrapRef} id={id} className={clsx(className, `${prefixCls}-wrapper`)} style={wrapStyle} data-column-fixed={anyColumnFixed}>
            <TableContext value={tableContextValue}>
                <TableRowStateContext value={rowStateContextValue}>
                    <Spin size="large" spinning={loading}>
                        <div ref={wrapRef} className={wrapCls}>
                            {['top', 'both'].includes(paginationPosition) && tablePagination}
                            {hasContent(titleNode) && (
                                <div id={titleNamesTable ? titleId : undefined} className={`${prefixCls}-title`} x-semi-prop="title">
                                    {titleNode}
                                </div>
                            )}
                            <div className={`${prefixCls}-container`} aria-rowcount={virtualized ? headerRowCount + virtualizedData.length : undefined} role={splitTable ? 'table' : undefined} {...(splitTable ? tableAria : null)}>
                                {fixedHeader && (
                                    <HeadTable
                                        ref={headerWrapRef as React.Ref<HTMLDivElement>}
                                        bodyHasScrollBar={bodyHasScrollBar}
                                        columns={columns}
                                        components={components}
                                        prefixCls={prefixCls}
                                        scroll={scroll}
                                        showHeader={showHeader}
                                        sticky={sticky}
                                        tableLayout={tableLayout}
                                        handleBodyScroll={handleBodyScroll}
                                        onHeaderRow={onHeaderRow}
                                    />
                                )}
                                <BodyTable
                                    ref={bodyWrapRef}
                                    anyColumnFixed={anyColumnFixed}
                                    bodyHasScrollBar={bodyHasScrollBar}
                                    childrenRecordName={childrenRecordName}
                                    clickGroupedRowToExpand={clickGroupedRowToExpand}
                                    columns={columns}
                                    components={components}
                                    dataSource={dataSource}
                                    emptySlot={emptySlot}
                                    expandedRowKeys={expandedRowKeys}
                                    expandIcon={expandIcon}
                                    expandRowByClick={expandRowByClick}
                                    groups={view.groups}
                                    headerRef={headerWrapRef}
                                    hideExpandedColumn={hideExpandedColumn}
                                    includeHeader={!fixedHeader}
                                    indentSize={indentSize}
                                    keepDOM={keepDOM}
                                    pageDisabledRowKeysSet={view.pageDisabledRowKeysSet}
                                    prefixCls={prefixCls}
                                    rowExpandable={rowExpandableOf}
                                    rowKey={rowKey}
                                    scroll={scroll}
                                    selectedRowKeysSet={selectedRowKeysSet}
                                    showHeader={showHeader}
                                    size={size}
                                    tableLayout={tableLayout}
                                    virtualized={virtualized}
                                    virtualizedData={virtualizedData}
                                    expandedRowRender={expandedRowRender}
                                    renderExpandIcon={renderExpandIcon}
                                    renderGroupSection={renderGroupSection}
                                    handleBodyScroll={handleBodyScroll}
                                    onGroupedRow={onGroupedRow}
                                    onHeaderRow={onHeaderRow}
                                    onRow={onRow}
                                    onRowContextMenu={onRowContextMenu}
                                    onRowDoubleClick={onRowDoubleClick}
                                    onRowMouseEnter={onRowMouseEnter}
                                    onRowMouseLeave={onRowMouseLeave}
                                />
                                {hasContent(footerNode) && (
                                    <div className={`${prefixCls}-footer`} x-semi-prop="footer">
                                        {footerNode}
                                    </div>
                                )}
                            </div>
                            {['bottom', 'both'].includes(paginationPosition) && tablePagination}
                        </div>
                    </Spin>
                </TableRowStateContext>
            </TableContext>
        </div>
    );
}
