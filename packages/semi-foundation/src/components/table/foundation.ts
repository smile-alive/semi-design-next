import { isEqual, merge, pick } from 'es-toolkit';
// compat get resolves deep path strings such as 'a.b'
import { get } from 'es-toolkit/compat';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { formatLocale } from '../../locale/format';
import { differenceUnique, withOrderSort } from '../../utils/array';
import isObject from '../../utils/is-object';
import type { ArrayElement } from '../../utils/type';
import warning, { isDev } from '../../utils/warning';
import type { BaseCheckboxProps } from '../checkbox/checkbox-foundation';
import { convertDataToEntities, calcCheckedKeysForChecked, calcCheckedKeysForCheckedKeys, calcCheckedKeysForUnchecked } from '../tree/tree-util';
import { strings, numbers } from './constants';
import { buildRecordsByKey, flattenBodyRows, getChangedRowKeys, isMissingDataIndex, mergeColumns } from './utils';

export interface BaseColumnProps<RecordType> {
    align?: BaseAlign;
    children?: Array<BaseColumnProps<RecordType>>;
    className?: string;
    colSpan?: number;
    dataIndex?: string;
    defaultFilteredValue?: any[];
    defaultSortOrder?: BaseSortOrder;
    filterChildrenRecord?: boolean;
    filterDropdown?: any;
    filterDropdownProps?: Record<string, any>;
    filterDropdownVisible?: boolean;
    // framework-specific; the foundation never reads it
    filterIcon?: unknown;
    filterMultiple?: boolean;
    filteredValue?: any[];
    filters?: BaseFilter[];
    fixed?: BaseFixed;
    key?: string | number;
    onCell?: BaseOnCell<RecordType>;
    onFilter?: BaseOnFilter<RecordType>;
    onFilterDropdownVisibleChange?: BaseOnFilterDropdownVisibleChange;
    // framework-specific; the foundation never calls it
    onHeaderCell?: unknown;
    render?: (...args: any[]) => any;
    renderFilterDropdownItem?: (...args: any[]) => any;
    sortChildrenRecord?: boolean;
    sortOrder?: BaseSortOrder;
    sorter?: BaseSorter<RecordType>;
    title?: any;
    useFullRender?: boolean;
    width?: string | number;
    ellipsis?: BaseEllipsis;
}

export interface OnChangeExtra {
    changeType?: 'sorter' | 'filter' | 'pagination';
}

export interface TableScrollMetrics {
    scrollLeft: number;
    scrollWidth: number;
    clientWidth: number;
    rtl: boolean;
}

/** Whether the scroller has more content on its physical left or right, like `scroll-state(scrollable: left | right)` */
export interface TableScrollableEdges {
    left: boolean;
    right: boolean;
}

export interface TableAdapter<RecordType, P extends TableBaseProps<RecordType> = TableBaseProps<RecordType>> extends DefaultAdapter<P, TableBaseState<RecordType>> {
    /** The element wrapping the pagination, title, header, body and footer; null while it is not mounted */
    getWrapper: () => HTMLElement | null | undefined;
    /** The body scroller; null while it is not mounted */
    getBodyWrapper: () => HTMLElement | null | undefined;
    notifyFilterDropdownVisibleChange: (column: BaseColumnProps<RecordType>, visible: boolean) => void;
    /** Calls pagination.onChange, which takes over paging from the table */
    notifyPageChange: (currentPage: number, pageSize: number) => void;
    notifyChange: (changeInfo: { pagination: BasePagination; filters: BaseChangeInfoFilter<RecordType>[]; sorter: BaseChangeInfoSorter<RecordType>; extra: OnChangeExtra }) => void;
    notifyExpand: (expanded: boolean, record: BaseIncludeGroupRecord<RecordType>, mouseEvent: any) => void;
    /** expandedRowKeys is the next expansion, group keys included */
    notifyExpandedRowsChange: (expandedRows: BaseIncludeGroupRecord<RecordType>[], expandedRowKeys: BaseRowKeyType[]) => void;
    notifySelect: (record: BaseIncludeGroupRecord<RecordType>, selected: boolean, selectedRows: BaseIncludeGroupRecord<RecordType>[], event: any) => void;
    notifySelectAll: (selected: boolean, selectedRows: BaseIncludeGroupRecord<RecordType>[], changedRows: BaseIncludeGroupRecord<RecordType>[], e: any) => void;
    notifySelectionChange: (selectedRowKeys: BaseRowKeyType[], selectedRows: BaseIncludeGroupRecord<RecordType>[]) => void;
}

/**
 * The props the data pipeline reads; the static methods take them explicitly so render can call them
 */
export interface BaseTableDataProps<RecordType> {
    dataSource?: RecordType[];
    rowKey?: BaseRowKey<RecordType>;
    childrenRecordName?: string;
    groupBy?: BaseGroupBy<RecordType>;
    pagination?: BasePagination | boolean;
    rowSelection?: { getCheckboxProps?: GetCheckboxProps<RecordType> } | boolean;
}

export interface TableBaseRowSelection<RecordType> {
    selectedRowKeys?: BaseRowKeyType[];
    defaultSelectedRowKeys?: BaseRowKeyType[];
    getCheckboxProps?: GetCheckboxProps<RecordType>;
    checkRelation?: CheckRelation;
    clickRow?: boolean;
    disabled?: boolean;
}

export interface TableBaseProps<RecordType> extends BaseTableDataProps<RecordType> {
    rowSelection?: TableBaseRowSelection<RecordType> | boolean;
    expandedRowKeys?: BaseRowKeyType[];
    defaultExpandedRowKeys?: BaseRowKeyType[];
    defaultExpandAllRows?: boolean;
    expandAllRows?: boolean;
    defaultExpandAllGroupRows?: boolean;
    expandAllGroupRows?: boolean;
    expandedRowRender?: (...args: any[]) => any;
    scroll?: { y?: number | string; scrollToFirstRowOnChange?: boolean };
    /**
     * Not a user prop: the host passes the leaf columns it resolves from the columns prop or the child columns, the same
     * reference until they change, so a change reaches handlePropsChange like a prop's
     */
    flattenColumns?: BaseColumnProps<RecordType>[];
}

export type TableBaseStateRowSelection<RecordType> = (TableBaseRowSelection<RecordType> & { selectedRowKeysSet?: Set<BaseRowKeyType> }) | null;

export interface TableBaseState<RecordType> {
    /** The flattened columns from props; the queries were last merged with them */
    flattenColumns?: BaseColumnProps<RecordType>[];
    /** The flattened columns with the current sort order and filtered values */
    queries?: BaseColumnProps<RecordType>[];
    /** The rows of the current page */
    dataSource?: RecordType[];
    expandedRowKeys?: BaseRowKeyType[];
    rowSelection?: TableBaseStateRowSelection<RecordType>;
    pagination?: BasePagination;
    /** Group key (what groupBy returns) -> the row keys in that group */
    groups?: Map<string | number, Set<BaseRowKeyType>>;
    allRowKeys?: BaseRowKeyType[];
    pageDisabledRowKeys?: BaseRowKeyType[];
    pageDisabledRowKeysSet?: Set<BaseRowKeyType>;
    headWidths?: BaseHeadWidth[][];
    bodyHasScrollBar?: boolean;
    prePropRowSelection?: TableBaseProps<RecordType>['rowSelection'];
    prePagination?: TableBaseProps<RecordType>['pagination'];
    preExpandedRowKeys?: BaseRowKeyType[];
    filteredDisabledRowKeys?: BaseRowKeyType[];
    filteredDisabledRowKeysSet?: Set<BaseRowKeyType>;
    halfCheckedRowKeys?: BaseRowKeyType[];
    halfCheckedRowKeysSet?: Set<BaseRowKeyType>;
    keyEntities?: BaseEntitys;
    filteredSortedDataSource?: RecordType[];
    filteredSortedRowKeys?: BaseRowKeyType[];
    filteredSortedRowKeysSet?: Set<BaseRowKeyType>;
}

/** The state with the columns typed as the framework's column type C, whose objects the foundation keeps as given */
export type TableColumnsState<RecordType, C extends BaseColumnProps<RecordType>> = Omit<TableBaseState<RecordType>, 'flattenColumns' | 'queries'> & {
    flattenColumns?: C[];
    queries?: C[];
};

export default class TableFoundation<RecordType, P extends TableBaseProps<RecordType> = TableBaseProps<RecordType>> extends BaseFoundation<TableAdapter<RecordType, P>, P, TableBaseState<RecordType>> {
    // Without `scroll-state` container queries (Chrome < 133) the fixed-column shadows follow data attributes written by
    // syncScrollEdges. Removable once Firefox and Safari support `container-type: scroll-state`.
    #trackScrollEdges: boolean | undefined;
    // Shift+click works like Finder: the anchor is the last row clicked without Shift, and each Shift+click replaces the
    // previous range, so the selection from before the first Shift+click is kept to apply the new range to. When the
    // selection no longer matches the last range's result, something else changed it and it becomes the new base.
    #rangeAnchor: BaseRowKeyType | null = null;
    #rangeBase: Set<BaseRowKeyType> | null = null;
    #rangeResult: Set<BaseRowKeyType> | null = null;
    #spaceShiftKey = false;
    #missingDataIndex = false;
    // every prop deriveState or handlePropsChange compares with its previous value; one missing here never updates
    static override readonly propKeys = ['flattenColumns', 'dataSource', 'rowSelection', 'pagination', 'expandedRowKeys', 'expandAllRows', 'expandAllGroupRows'];

    static #pagerIsControlled(props: { pagination?: BasePagination | boolean }) {
        return (props.pagination as BasePagination)?.currentPage != null;
    }

    // maps the tree utilities' string keys back to the user's rowKey values; `known` covers keys without an entity
    static #restoreRowKeys(keys: Iterable<string>, known: BaseRowKeyType[], keyEntities?: BaseEntitys): BaseRowKeyType[] {
        const knownMap = new Map(known.map((key) => [String(key), key]));
        return [...keys].map((key) => keyEntities?.[key]?.data?.rowKey ?? knownMap.get(key) ?? key);
    }

    static #getRelatedCheckedRowKeys(rowKeys: BaseRowKeyType[] = [], keyEntities: BaseEntitys = {}) {
        const { checkedKeys, halfCheckedKeys } = calcCheckedKeysForCheckedKeys(rowKeys.map(String), keyEntities, new Set(), new Set());
        return { checkedRowKeys: TableFoundation.#restoreRowKeys(checkedKeys, rowKeys, keyEntities), halfCheckedRowKeys: TableFoundation.#restoreRowKeys(halfCheckedKeys, rowKeys, keyEntities) };
    }

    static #sameKeys(a: Set<BaseRowKeyType>, b: Set<BaseRowKeyType>) {
        return a.size === b.size && [...a].every((key) => b.has(key));
    }

    static #sortOrderIsControlled(column: { sortOrder?: unknown }) {
        return column.sortOrder != null;
    }

    // a body scroller's metrics give the data-scrollable-* attributes on its parent, the container the header shares
    static #syncScrollableEdges(body: HTMLElement) {
        const { left, right } = TableFoundation.getScrollableEdges({ scrollLeft: body.scrollLeft, scrollWidth: body.scrollWidth, clientWidth: body.clientWidth, rtl: getComputedStyle(body).direction === 'rtl' });
        body.parentElement?.toggleAttribute('data-scrollable-left', left);
        body.parentElement?.toggleAttribute('data-scrollable-right', right);
    }

    #addNoDuplicatedItemsToArr(srcArr: any[] = [], ...objArrs: any[][]) {
        for (const objArr of objArrs) {
            if (Array.isArray(objArr)) {
                for (const item of objArr) {
                    if (!srcArr.includes(item)) {
                        srcArr.push(item);
                    }
                }
            }
        }

        return srcArr;
    }

    #notifyChange(pagination: BasePagination, filters?: BaseChangeInfoFilter<RecordType>[], sorter?: BaseChangeInfoSorter<RecordType>, extra?: OnChangeExtra) {
        pagination = pagination == null ? this.#getPagination() : pagination;
        filters = filters == null ? this.#getAllFilters() : filters;
        sorter = sorter == null ? (this.#getAllSorters()[0] as BaseChangeInfoSorter<RecordType>) : sorter;
        if (this.getProp('scroll')?.scrollToFirstRowOnChange) {
            this.#resetScrollY();
        }
        this.adapter.notifyChange({
            pagination: { ...pagination },
            filters: [...filters],
            sorter,
            extra: { ...extra },
        });
    }

    // a body that scrolls on its own goes back to its top; otherwise the page scrolls to the table
    #resetScrollY() {
        if (this.getProp('scroll')?.y) {
            const body = this.adapter.getBodyWrapper();
            if (body) {
                body.scrollTop = 0;
            }
        } else {
            this.adapter.getWrapper()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // inline columns are new on every render, so it warns when a column starts missing one, not on every change
    #warnMissingDataIndex() {
        const missing = this.getProp('flattenColumns')?.some(isMissingDataIndex) ?? false;
        warning(missing && !this.#missingDataIndex, `[Semi Table] The column with sorter or filter must pass the 'dataIndex' prop`);
        this.#missingDataIndex = missing;
    }

    #rowExpansionIsControlled() {
        return Array.isArray(this.getProp('expandedRowKeys'));
    }

    #selectionIsControlled() {
        const rowSelection = this.getProp('rowSelection');
        return isObject(rowSelection) && Array.isArray(rowSelection.selectedRowKeys);
    }

    // judged from props columns, not cachedColumns
    #sorterIsControlled(dataIndex: string) {
        const query = dataIndex && this.getQuery(dataIndex, this.getState('flattenColumns'));
        return Boolean(query && TableFoundation.#sortOrderIsControlled(query));
    }

    #filterIsControlled(dataIndex: string) {
        const query = dataIndex && this.getQuery(dataIndex, this.getState('flattenColumns'));
        return Boolean(query && Array.isArray(query.filteredValue));
    }

    #getSelectedRowKeys() {
        return [...(this.getState('rowSelection')?.selectedRowKeys ?? [])];
    }

    #getSelectedRowKeysSet() {
        return this.getState('rowSelection')?.selectedRowKeysSet ?? new Set();
    }

    #getFilteredDisabledRowKeysSet() {
        return this.getState('filteredDisabledRowKeysSet') ?? new Set<BaseRowKeyType>();
    }

    #getCheckRelation(): CheckRelation {
        return this.getState('rowSelection')?.checkRelation ?? 'unRelated';
    }

    // each key list is written with the Set that render and the selection checks read
    #setSelectedRowKeys(selectedRowKeys: BaseRowKeyType[]) {
        this.setState({ rowSelection: { ...this.getState('rowSelection'), selectedRowKeys: [...selectedRowKeys], selectedRowKeysSet: new Set(selectedRowKeys) } });
    }

    #setHalfCheckedRowKeys(halfCheckedRowKeys: BaseRowKeyType[]) {
        this.setState({ halfCheckedRowKeys, halfCheckedRowKeysSet: new Set(halfCheckedRowKeys) });
    }

    #setPageDisabledRowKeys(pageDisabledRowKeys: BaseRowKeyType[]) {
        this.setState({ pageDisabledRowKeys, pageDisabledRowKeysSet: new Set(pageDisabledRowKeys) });
    }

    #setFilteredDisabledRowKeys(filteredDisabledRowKeys: BaseRowKeyType[]) {
        this.setState({ filteredDisabledRowKeys, filteredDisabledRowKeysSet: new Set(filteredDisabledRowKeys) });
    }

    // the rows of the current page in render order, without collapsed tree children and groups: a range covers only
    // the rows the user sees between the two clicks
    #getVisibleRowKeys() {
        const { rowKey, childrenRecordName } = this.getProps();
        const dataSource = this.getState('dataSource');
        const options = { rowKey, childrenRecordName, expandedRowKeys: this.getState('expandedRowKeys'), hasExpandedRow: false };
        return flattenBodyRows(options, dataSource, this.getState('groups'), buildRecordsByKey(dataSource, rowKey)).flatMap((row) => (row.kind === 'base' ? [row.key] : []));
    }

    /** Gives every enabled row from the anchor to `rowKey` the anchor's state; false when either row is not shown */
    #selectRange(rowKey: BaseRowKeyType) {
        const visibleRowKeys = this.#getVisibleRowKeys();
        const anchorIndex = visibleRowKeys.indexOf(this.#rangeAnchor);
        const index = visibleRowKeys.indexOf(rowKey);
        if (anchorIndex === -1 || index === -1) {
            return false;
        }

        const currentKeys = this.#getSelectedRowKeysSet();
        if (!this.#rangeBase || !this.#rangeResult || !TableFoundation.#sameKeys(this.#rangeResult, currentKeys)) {
            this.#rangeBase = new Set(this.#getSelectedRowKeys());
        }
        const selected = this.#rangeBase.has(this.#rangeAnchor);
        const disabledRowKeys = this.#getFilteredDisabledRowKeysSet();
        const nextKeys = new Set(this.#rangeBase);
        for (const key of visibleRowKeys.slice(Math.min(anchorIndex, index), Math.max(anchorIndex, index) + 1)) {
            if (!disabledRowKeys.has(key)) {
                if (selected) {
                    nextKeys.add(key);
                } else {
                    nextKeys.delete(key);
                }
            }
        }
        // Shift+mousedown extends the page's text selection over the rows clicked across
        window.getSelection()?.removeAllRanges();

        this.#rangeResult = nextKeys;
        if (TableFoundation.#sameKeys(nextKeys, currentKeys)) {
            return true;
        }
        const selectedRowKeys = [...nextKeys];
        if (!this.#selectionIsControlled()) {
            this.#setSelectedRowKeys(selectedRowKeys);
        }
        this.adapter.notifySelectionChange(selectedRowKeys, this.getRecordsByKeys(null, selectedRowKeys));
        return true;
    }

    #getDataSource() {
        return this.getProp('dataSource') || [];
    }

    #getPagination() {
        return this.getState('pagination') || {};
    }

    #getAllFilters(queries?: BaseColumnProps<RecordType>[]) {
        queries = queries || this.getState('queries');
        const filters: BaseChangeInfoFilter<RecordType>[] = [];

        queries?.forEach((query) => {
            if (Array.isArray(query.filteredValue) && (query.filteredValue.length || this.#filterIsControlled(query.dataIndex))) {
                filters.push(query);
            }
        });

        return filters;
    }

    #getAllSorters(queries?: BaseColumnProps<RecordType>[]) {
        queries = queries || this.getState('queries');

        return queries?.filter((query) => query.sorter && query.sortOrder) ?? [];
    }

    #filterQueries(targetQuery: BaseColumnProps<RecordType>, queries: BaseColumnProps<RecordType>[], keys = ['dataIndex']) {
        queries = queries == null ? this.getState('queries') : queries;
        const filteredQueries: BaseColumnProps<RecordType>[] = [];
        const filteredIndexes: number[] = [];

        queries?.forEach((itQuery, index) => {
            const flag = keys?.some((k) => k && targetQuery[k] != null && targetQuery[k] === itQuery[k]) ?? false;

            if (flag) {
                filteredQueries.push(itQuery);
                filteredIndexes.push(index);
            }
        });

        return { filteredQueries, filteredIndexes };
    }

    #mergeToQueries(query: BaseColumnProps<RecordType>, queries: BaseColumnProps<RecordType>[], keys = ['dataIndex']) {
        queries = queries == null ? this.getState('queries') : queries;
        queries = [...queries];
        query = { ...query };

        const { filteredQueries, filteredIndexes } = this.#filterQueries(query, queries, keys);

        filteredQueries?.forEach((_curQuery, idx) => {
            queries[filteredIndexes[idx]] = { ...query };
        });

        return queries;
    }

    #getGroups() {
        if (this.getProp('groupBy') !== null) {
            return this.getState('groups');
        }
        return null;
    }

    #initSelectedRowKeys(keyEntities: BaseEntitys) {
        const rowSelection = this.getProp('rowSelection');
        let rowKeys: BaseRowKeyType[] = [];
        if (rowSelection) {
            const selectedRowKeys = isObject(rowSelection) ? rowSelection.selectedRowKeys : undefined;
            const defaultSelectedRowKeys = isObject(rowSelection) ? rowSelection.defaultSelectedRowKeys : undefined;
            const controlled = Array.isArray(selectedRowKeys);

            if (controlled) {
                this.#addNoDuplicatedItemsToArr(rowKeys, selectedRowKeys);
            } else if (Array.isArray(defaultSelectedRowKeys)) {
                this.#addNoDuplicatedItemsToArr(rowKeys, defaultSelectedRowKeys);
            }

            let halfCheckedRowKeys: BaseRowKeyType[] = [];
            if (this.#getCheckRelation() === 'related') {
                const related = TableFoundation.#getRelatedCheckedRowKeys(rowKeys, keyEntities);
                halfCheckedRowKeys = related.halfCheckedRowKeys;
                if (!controlled) {
                    // default keys check descendants and parents as a click would; keys outside the data stay
                    const known = new Set(rowKeys.map(String));
                    rowKeys = [...rowKeys, ...related.checkedRowKeys.filter((key) => !known.has(String(key)))];
                }
            }

            this.#setSelectedRowKeys(rowKeys);
            this.#setHalfCheckedRowKeys(halfCheckedRowKeys);
        }
    }

    // each argument left out comes from the state
    #getPageData(dataSource?: RecordType[], pagination?: BasePagination, queries?: BaseColumnProps<RecordType>[]) {
        const filteredSortedDataSource = this.getState('filteredSortedDataSource') ?? [];
        dataSource = dataSource == null ? [...filteredSortedDataSource] : dataSource;
        pagination = pagination == null ? this.getState('pagination') && { ...this.getState('pagination') } : pagination;
        queries = queries == null ? [...this.getState('queries')] : queries;
        return TableFoundation.getPageData(this.getProps(), dataSource, pagination, queries);
    }

    #setPageData({ pagination, dataSource, disabledRowKeys, allRowKeys, groups }: BasePageData<RecordType> = {}) {
        this.#setPageDisabledRowKeys(disabledRowKeys);
        this.setState({ allRowKeys, pagination, groups, dataSource });
    }

    #setCachedFilteredSortedDataSource(filteredSortedDataSource: RecordType[]) {
        const filteredSortedRowKeys = this.getAllRowKeys(filteredSortedDataSource);
        this.setState({ filteredSortedDataSource, filteredSortedRowKeys, filteredSortedRowKeysSet: new Set(filteredSortedRowKeys) });
    }

    #applyQueries(queries: BaseColumnProps<RecordType>[]) {
        const dataSource = [...this.getProp('dataSource')];
        const sortedDataSource = this.getFilteredSortedDataSource(dataSource, queries);
        const allDataDisabledRowKeys = this.getAllDisabledRowKeys(sortedDataSource);
        this.#setCachedFilteredSortedDataSource(sortedDataSource);
        this.#setFilteredDisabledRowKeys(allDataDisabledRowKeys);
        const pageData = this.#getPageData(sortedDataSource);
        this.#setPageData(pageData);
    }

    #updateKeyEntities() {
        const keyEntities = TableFoundation.buildKeyEntities(this.getProps(), this.getProp('dataSource'));
        this.setState({ keyEntities });
        this.#setHalfCheckedRowKeys(TableFoundation.#getRelatedCheckedRowKeys(this.#getSelectedRowKeys(), keyEntities).halfCheckedRowKeys);
    }

    /**
     * @param dataSourceChanged the dataSource prop changed: the uncontrolled page goes back to 1
     * @param recompute the dataSource prop or the columns changed
     */
    #handleDataUpdate(dataSourceChanged: boolean, recompute: boolean, prevPagination: TableBaseProps<RecordType>['pagination']) {
        const { dataSource, groupBy, pagination: propsPagination, defaultExpandAllRows, expandAllRows, expandAllGroupRows } = this.getProps();
        // before the writes below: the page is computed from the pagination before this update
        const statePagination = this.getState('pagination');
        const states: BasePageData<RecordType> = {};

        if (recompute) {
            const filteredSortedDataSource = this.getFilteredSortedDataSource(dataSource, this.getState('queries'));
            const allDataDisabledRowKeys = this.getAllDisabledRowKeys(filteredSortedDataSource);
            this.#setCachedFilteredSortedDataSource(filteredSortedDataSource);
            this.#setFilteredDisabledRowKeys(allDataDisabledRowKeys);
            states.dataSource = filteredSortedDataSource;

            if (this.#getCheckRelation() === 'related') {
                this.#updateKeyEntities();
            }

            if (groupBy) {
                states.groups = null;
            }
        }

        if (dataSourceChanged) {
            states.pagination = isObject(statePagination)
                ? {
                      ...statePagination,
                      currentPage: (isObject(propsPagination) && propsPagination.currentPage) || 1,
                  }
                : statePagination;
        }

        // deriveState already holds the new pageSize; the rows still come from the old page slice
        const pageSizeChanged = isObject(propsPagination) && propsPagination.pageSize !== (isObject(prevPagination) ? prevPagination.pageSize : undefined);
        if (pageSizeChanged) {
            states.pagination ??= { ...statePagination };
        }

        if (Object.keys(states).length) {
            const pageData = this.#getPageData(states.dataSource ?? null, states.pagination ?? (statePagination && { ...statePagination }), null);

            this.setState({ allRowKeys: pageData.allRowKeys });
            this.#setPageDisabledRowKeys(pageData.disabledRowKeys);

            if ('dataSource' in states) {
                // groups recompute with the columns too; only new data, which may bring new groups, expands them again
                const expandNewGroups = defaultExpandAllRows && dataSourceChanged && pageData.groups?.size && !this.#rowExpansionIsControlled();
                if (expandNewGroups || expandAllRows || expandAllGroupRows) {
                    this.initExpandedRowKeys(pageData);
                }
                this.setState({ dataSource: pageData.dataSource });
                states.pagination = pageData.pagination;
            }
            if (pageSizeChanged && !('dataSource' in states)) {
                this.setState({ dataSource: pageData.dataSource });
            }
            if ('groups' in states) {
                this.setState({ groups: pageData.groups });
            }
            if ('pagination' in states) {
                this.setState({ pagination: pageData.pagination });
            }
        }
    }

    protected getFilteredSortedDataSource(dataSource: RecordType[], queries: BaseColumnProps<RecordType>[]) {
        return TableFoundation.getFilteredSortedDataSource(this.getProps(), dataSource, queries);
    }

    protected getRecordKey(record: RecordType): BaseRowKeyType {
        return TableFoundation.getRecordKey({ rowKey: this.getProp('rowKey') }, record);
    }

    protected calcCheckedKeysForSelect(realKey: BaseRowKeyType, selected: boolean, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
        const keyEntities = this.getState('keyEntities') ?? {};
        const keyStr = String(realKey);

        if (!keyEntities || !keyEntities[keyStr]) {
            if (selected) {
                checkedKeys.add(keyStr);
            } else {
                checkedKeys.delete(keyStr);
            }
            return { checkedKeys, halfCheckedKeys };
        }

        if (selected) {
            return calcCheckedKeysForChecked(keyStr, keyEntities, checkedKeys, halfCheckedKeys);
        } else {
            return calcCheckedKeysForUnchecked(keyStr, keyEntities, checkedKeys, halfCheckedKeys);
        }
    }

    /**
     * The records of the given keys, children included
     * @param dataSource null means the dataSource prop
     */
    protected getRecordsByKeys(dataSource: RecordType[], keys: BaseRowKeyType[], keysSet?: Set<BaseRowKeyType>) {
        dataSource = dataSource == null ? this.#getDataSource() : dataSource;
        if (!(keysSet instanceof Set)) {
            keysSet = new Set(keys);
        }
        const childrenRecordName = this.getProp('childrenRecordName');

        const records: BaseIncludeGroupRecord<RecordType>[] = [];

        if (keysSet.size && Array.isArray(dataSource) && dataSource.length) {
            records.push(...dataSource.filter((data) => keysSet.has(this.getRecordKey(data))));

            if (records.length < keys.length) {
                for (const item of dataSource) {
                    const children = get(item, childrenRecordName);
                    if (Array.isArray(children) && children.length) {
                        records.push(...this.getRecordsByKeys(children, keys, keysSet));
                    }
                }
            }
        }

        return records;
    }

    protected getAllDisabledRowKeys(dataSource?: RecordType[]) {
        return TableFoundation.getAllDisabledRowKeys(this.getProps(), dataSource == null ? this.#getDataSource() : dataSource);
    }

    protected getAllRowKeys(dataSource: RecordType[]): BaseRowKeyType[] {
        return TableFoundation.getAllRowKeys(this.getProps(), dataSource == null ? this.#getDataSource() : dataSource);
    }

    protected getQuery(dataIndex: string, queries?: BaseColumnProps<RecordType>[]) {
        queries = queries || this.getState('queries');

        if (dataIndex != null) {
            return queries?.find((query) => query.dataIndex === dataIndex);
        }
        return undefined;
    }

    protected override initOnce() {
        const { defaultExpandAllRows, expandAllRows, expandAllGroupRows } = this.getProps();
        const groups = this.getState('groups');
        // defaultExpandAllRows is only a default, so its groups leave controlled keys alone; the other options still apply
        if (!(defaultExpandAllRows && !expandAllRows && !expandAllGroupRows && groups?.size && this.#rowExpansionIsControlled())) {
            this.initExpandedRowKeys({ groups });
        }
        this.#initSelectedRowKeys(this.getState('keyEntities'));
        this.#warnMissingDataIndex();
    }

    static initColumnsFilteredValueAndSorterOrder<R, C extends BaseColumnProps<R> = BaseColumnProps<R>>(columns: C[]) {
        columns.forEach((column) => {
            TableFoundation.initFilteredValue(column);
            TableFoundation.initSorterOrder(column);
        });
        return columns;
    }

    static initFilteredValue<R>(column: BaseColumnProps<R>) {
        const { defaultFilteredValue, filteredValue } = column;
        // onFilter may be absent (server-side filtering) but filteredValue still drives the filters output
        if (filteredValue === undefined) {
            if (Array.isArray(defaultFilteredValue) && defaultFilteredValue.length) {
                column.filteredValue = defaultFilteredValue;
            } else {
                column.filteredValue = [];
            }
        }
    }

    static initSorterOrder<R>(column: BaseColumnProps<R>) {
        const { defaultSortOrder, sortOrder, sorter } = column;
        if (sorter && sortOrder === undefined) {
            if (defaultSortOrder !== undefined) {
                column.sortOrder = defaultSortOrder;
            } else {
                column.sortOrder = false;
            }
        }
    }

    static getFilteredSortedDataSource<R>(props: BaseTableDataProps<R>, dataSource: R[], queries: BaseColumnProps<R>[]) {
        const filteredDataSource = TableFoundation.filterDataSource(
            props,
            dataSource,
            queries.filter((query) => {
                const currentFilteredValue = query.filteredValue ? query.filteredValue : query.defaultFilteredValue;
                return typeof query.onFilter === 'function' && Array.isArray(currentFilteredValue) && currentFilteredValue.length;
            })
        );
        return TableFoundation.sortDataSource(
            props,
            filteredDataSource,
            queries.filter((query) => query && typeof query.sorter === 'function')
        );
    }

    static getPageData<R>(props: BaseTableDataProps<R>, dataSource: R[], pagination: BasePagination, queries: BaseColumnProps<R>[]): BasePageData<R> {
        let groups;
        if (props.groupBy != null) {
            const { groups: groupedGroups, dataSource: groupedData } = TableFoundation.groupDataSource(props, dataSource);
            dataSource = groupedData;
            groups = groupedGroups;
        }

        pagination = TableFoundation.normalizePagination(props, pagination, dataSource);
        dataSource = TableFoundation.limitPageDataSource(props, dataSource, pagination);

        return {
            dataSource,
            groups,
            pagination,
            disabledRowKeys: TableFoundation.getAllDisabledRowKeys(props, dataSource),
            allRowKeys: TableFoundation.getAllRowKeys(props, dataSource),
            queries,
        };
    }

    static groupDataSource<R>(props: BaseTableDataProps<R>, dataSource: R[]) {
        const { groupBy } = props;
        const groups = new Map<string | number, Set<BaseRowKeyType>>();
        const newDataSource = [];

        if (groupBy != null) {
            dataSource?.forEach((record) => {
                const groupKey = typeof groupBy === 'function' ? groupBy(record) : get(record, groupBy);

                if (groupKey != null && groupKey !== '') {
                    const recordKey = TableFoundation.getRecordKey(props, record);
                    let group = groups.get(groupKey);

                    if (!(group instanceof Set)) {
                        group = new Set([recordKey]);
                        groups.set(groupKey, group);
                    } else {
                        group.add(recordKey);
                    }
                }
            });
        }

        if (groups && groups.size) {
            // looked up in the sorted and filtered records the groups come from, which carry the sorted and filtered
            // children. The first record of a key wins; a record without a key matches nothing
            const recordsByKey = new Map<BaseRowKeyType, R>();
            dataSource?.forEach((record) => {
                const recordKey = TableFoundation.getRecordKey(props, record);
                if (recordKey != null && recordKey !== '' && !recordsByKey.has(recordKey)) {
                    recordsByKey.set(recordKey, record);
                }
            });
            groups.forEach((set) => {
                if (set instanceof Set) {
                    set.forEach((realKey) => {
                        newDataSource.push(recordsByKey.get(realKey));
                    });
                }
            });
        } else {
            newDataSource.push(...dataSource);
        }

        return { groups, dataSource: newDataSource };
    }

    static sortDataSource<R>(props: BaseTableDataProps<R>, dataSource: R[], sorters: BaseSorterInfo<R>[]) {
        for (const sorterObj of sorters ?? []) {
            const { sorter, sortOrder, defaultSortOrder, sortChildrenRecord } = sorterObj;
            const currentSortOrder = TableFoundation.isSortOrderValid(sortOrder) ? sortOrder : defaultSortOrder;
            if (typeof sorter === 'function' && (currentSortOrder === 'ascend' || currentSortOrder === 'descend')) {
                if (sortChildrenRecord) {
                    const { childrenRecordName } = props;
                    dataSource =
                        dataSource &&
                        dataSource.map((record) => {
                            const children = get(record, childrenRecordName);

                            if (Array.isArray(children) && children.length) {
                                return {
                                    ...record,
                                    [childrenRecordName]: TableFoundation.sortDataSource(props, children, [sorterObj]),
                                };
                            }
                            return record;
                        });
                }

                dataSource = dataSource.toSorted(withOrderSort(sorter, currentSortOrder));

                break;
            }
        }

        return dataSource;
    }

    static filterDataSource<R>(props: BaseTableDataProps<R>, dataSource: R[], filters: BaseChangeInfoFilter<R>[]) {
        let filteredData: Map<BaseRowKeyType, R> | null = null;
        let hasValidFilters = false;
        const { childrenRecordName } = props;
        const getRecordKey = (record: R) => TableFoundation.getRecordKey(props, record);

        filters?.forEach((filterObj) => {
            const { onFilter, filteredValue, filterChildrenRecord, defaultFilteredValue } = filterObj;
            const currentFilteredValue = Array.isArray(filteredValue) ? filteredValue : defaultFilteredValue;
            if (typeof onFilter === 'function' && Array.isArray(currentFilteredValue) && currentFilteredValue.length) {
                hasValidFilters = true;

                if (filteredData === null) {
                    filteredData = new Map();
                } else {
                    dataSource = Array.from(filteredData && filteredData.values());
                    filteredData = new Map();
                }
                dataSource?.forEach((record) => {
                    currentFilteredValue.forEach((value) => {
                        const childrenRecords = get(record, childrenRecordName);
                        const recordKey = getRecordKey(record);

                        let filteredChildren;

                        if (Array.isArray(childrenRecords) && childrenRecords.length && filterChildrenRecord) {
                            filteredChildren = TableFoundation.filterDataSource(props, childrenRecords, [filterObj]);
                        }

                        if (Array.isArray(filteredChildren) && filteredChildren.length) {
                            if (recordKey != null) {
                                const children = get(filteredData.get(recordKey), childrenRecordName, []);
                                filteredData.set(recordKey, {
                                    ...record,
                                    [childrenRecordName]: filteredChildren.reduce(
                                        (arr, cur) => {
                                            if (arr.find((item: any) => getRecordKey(item) === getRecordKey(cur)) == null) {
                                                arr.push(cur);
                                            }
                                            return arr;
                                        },
                                        // @ts-ignore
                                        [...children]
                                    ),
                                });
                            }
                        } else if (onFilter(value, record)) {
                            filteredData.set(recordKey, record);
                        }
                    });
                });
            }
        });

        if (hasValidFilters) {
            dataSource = Array.from(filteredData && filteredData.values());
        }

        return dataSource;
    }

    static limitPageDataSource<R>(props: BaseTableDataProps<R>, dataSource: R[], pagination: BasePagination) {
        let pageData = dataSource;
        const pageNo = pagination?.currentPage;

        if (props.pagination !== false && pageNo && dataSource && pagination && !TableFoundation.#pagerIsControlled(props)) {
            const { pageSize = numbers.DEFAULT_PAGE_SIZE } = pagination;

            const start = (pageNo - 1) * pageSize;
            const end = pageNo * pageSize;

            pageData = dataSource.slice(start, end);
        }

        return pageData;
    }

    static normalizePagination<R>(props: BaseTableDataProps<R>, pagination: BasePagination, dataSource: R[]) {
        pagination = pagination == null ? {} : pagination;
        dataSource = dataSource == null ? props.dataSource || [] : dataSource;
        const propPagination = props.pagination;

        if (pagination) {
            pagination = typeof pagination === 'object' ? { ...pagination } : {};

            pagination = merge(
                {
                    total: (dataSource && dataSource.length) || 0,
                    pageSize: numbers.DEFAULT_PAGE_SIZE,
                    currentPage: (propPagination as BasePagination)?.defaultCurrentPage ?? 1,
                    position: strings.PAGINATION_POSITIONS[0],
                },
                pagination
            );

            if (!TableFoundation.#pagerIsControlled(props)) {
                const total = (propPagination as BasePagination)?.total ?? dataSource.length;
                const { currentPage, pageSize } = pagination;

                const realTotalPage = Math.ceil(total / pageSize);

                pagination.total = total;

                if (currentPage > realTotalPage) {
                    pagination.currentPage = 1;
                }
            }
        }

        return pagination;
    }

    static getRecordKey<R>({ rowKey }: BaseTableDataProps<R>, record: R): BaseRowKeyType {
        if (!record) {
            return undefined;
        }
        return typeof rowKey === 'function' ? rowKey(record) : get(record, rowKey);
    }

    static getAllDisabledRowKeys<R>(props: BaseTableDataProps<R>, dataSource: R[], getCheckboxProps?: GetCheckboxProps<R>) {
        getCheckboxProps = getCheckboxProps == null ? (props.rowSelection as { getCheckboxProps?: GetCheckboxProps<R> })?.getCheckboxProps : getCheckboxProps;
        const { childrenRecordName } = props;

        const disabledRowKeys: BaseRowKeyType[] = [];
        if (Array.isArray(dataSource) && dataSource.length && typeof getCheckboxProps === 'function') {
            for (const record of dataSource) {
                const checkboxProps = getCheckboxProps(record);

                if (checkboxProps && checkboxProps.disabled) {
                    disabledRowKeys.push(TableFoundation.getRecordKey(props, record));
                }

                const children = get(record, childrenRecordName);

                if (Array.isArray(children) && children.length) {
                    disabledRowKeys.push(...TableFoundation.getAllDisabledRowKeys(props, children, getCheckboxProps));
                }
            }
        }
        return disabledRowKeys;
    }

    static getAllRowKeys<R>(props: BaseTableDataProps<R>, dataSource: R[]): BaseRowKeyType[] {
        const { childrenRecordName } = props;
        const allRowKeys = [];

        if (Array.isArray(dataSource) && dataSource.length) {
            for (const record of dataSource) {
                const childrenRowKeys = [];
                const children = get(record, childrenRecordName);
                if (Array.isArray(children) && children.length) {
                    childrenRowKeys.push(...TableFoundation.getAllRowKeys(props, children));
                }
                allRowKeys.push(TableFoundation.getRecordKey(props, record), ...childrenRowKeys);
            }
        }

        return allRowKeys;
    }

    static buildKeyEntities<R>({ rowKey, childrenRecordName }: BaseTableDataProps<R>, dataSource: R[]): BaseEntitys {
        const convertToTreeData = (data: R[]) => {
            return data.map((record) => {
                const key = typeof rowKey === 'function' ? rowKey(record) : get(record, rowKey);
                const children = get(record, childrenRecordName);
                // the tree utilities compare keys with the checked Set, so entity keys must be strings; rowKey keeps
                // the original
                const node: any = { ...record, key: String(key), rowKey: key };
                if (Array.isArray(children) && children.length) {
                    node.children = convertToTreeData(children);
                }
                return node;
            });
        };

        const { keyEntities } = convertDataToEntities(convertToTreeData(dataSource ?? []), { key: 'key', children: 'children' });
        return keyEntities;
    }

    /** scrollLeft is 0 at the start edge and negative in RTL; a pixel of slack absorbs fractional scroll positions */
    static getScrollableEdges({ scrollLeft, scrollWidth, clientWidth, rtl }: TableScrollMetrics): TableScrollableEdges {
        const max = scrollWidth - clientWidth;
        const min = rtl ? -max : 0;
        return { left: scrollLeft - min > 1, right: min + max - scrollLeft > 1 };
    }

    static hasRowSelected(selectedRowKeys: BaseRowKeyType[], allRowKeysSet: Set<BaseRowKeyType>) {
        return Boolean(Array.isArray(selectedRowKeys) && selectedRowKeys.length && allRowKeysSet instanceof Set && allRowKeysSet.size && selectedRowKeys.filter((key) => allRowKeysSet.has(key)).length);
    }

    static allIsSelected(selectedRowKeysSet: Set<BaseRowKeyType>, disabledRowKeysSet: Set<BaseRowKeyType>, allKeys: BaseRowKeyType[]) {
        const filteredAllKeys = allKeys.filter((key) => key != null && !disabledRowKeysSet.has(key));
        if (filteredAllKeys && filteredAllKeys.length) {
            for (const key of filteredAllKeys) {
                if (key != null && !selectedRowKeysSet.has(key)) {
                    return false;
                }
            }
            return true;
        } else {
            const isAllSelected = allKeys.length && allKeys.every((rowKey) => selectedRowKeysSet.has(rowKey));
            return isAllSelected || false;
        }
    }

    static formatPaginationInfo({ total, pageSize, currentPage }: BasePagination = {}, defaultPageText = '', formatPageText?: boolean | ((pageInfo?: { currentStart?: number; currentEnd?: number; total?: number }) => any)) {
        let info = '';

        const currentStart = Math.min((currentPage - 1) * pageSize + 1, total);
        const currentEnd = Math.min(currentPage * pageSize, total);

        if (formatPageText || (formatPageText !== false && defaultPageText && total > 0)) {
            info = typeof formatPageText === 'function' ? formatPageText({ currentStart, currentEnd, total }) : formatLocale(defaultPageText, { currentStart, currentEnd, total });
        }

        return info;
    }

    static isSortOrderValid(sortOrder: BaseSortOrder) {
        return (typeof sortOrder === 'string' && strings.SORT_DIRECTIONS.includes(sortOrder)) || sortOrder === false;
    }

    /**
     * What a header cell shows for a column, from the column as given and its query (the state kept by dataIndex).
     * @param hasFilterDropdown whether the column brings its own filter dropdown; the framework knows what counts as one
     */
    static getColumnFlags<Q extends { dataIndex?: unknown; sortOrder?: unknown; defaultSortOrder?: unknown; filteredValue?: unknown; defaultFilteredValue?: unknown }>(
        column: { dataIndex?: unknown; sorter?: unknown; filters?: unknown; onFilter?: unknown; useFullRender?: boolean; renderFilterDropdown?: unknown; sortOrder?: unknown; showSortTip?: boolean },
        queries: Q[] | undefined,
        hasFilterDropdown: boolean
    ): ColumnFlags<Q> {
        const hasSorter = typeof column.sorter === 'function' || column.sorter === true;
        const hasFilter = (Array.isArray(column.filters) && column.filters.length > 0) || hasFilterDropdown || typeof column.renderFilterDropdown === 'function';
        const query = column.dataIndex != null ? queries?.find((item) => item.dataIndex === column.dataIndex) : undefined;
        const stateSortOrder = query?.sortOrder as BaseSortOrder;
        return {
            hasSorter,
            hasFilter,
            needsTitle: Boolean(column.sorter || column.filters || column.onFilter || column.useFullRender || hasFilter),
            // a click on the whole header cell sorts: a filter or the useFullRender parts need their own targets
            clickToSort: hasSorter && !hasFilter && !column.useFullRender,
            showSortTip: !TableFoundation.#sortOrderIsControlled(column) && column.showSortTip === true,
            query,
            sortOrder: TableFoundation.isSortOrderValid(stateSortOrder) ? stateSortOrder : ((query?.defaultSortOrder ?? false) as BaseSortOrder),
            filteredValue: query?.filteredValue ? query.filteredValue : query?.defaultFilteredValue,
        };
    }

    /**
     * The state that follows props, derived during render. Returns null when nothing changed.
     * @param flattenColumns the leaf columns of the props, the same reference until the columns change
     */
    static deriveState<R, C extends BaseColumnProps<R> = BaseColumnProps<R>>(props: TableBaseProps<R>, state: TableColumnsState<R, C>, flattenColumns: C[]): Partial<TableColumnsState<R, C>> | null {
        const changes: Partial<TableColumnsState<R, C>> = {};
        const { rowSelection, dataSource, pagination, expandedRowKeys } = props;

        if (flattenColumns !== state.flattenColumns) {
            changes.flattenColumns = flattenColumns;
            changes.queries = mergeColumns(state.queries, flattenColumns);
        }

        if (rowSelection !== state.prePropRowSelection) {
            // built from the current prop alone, so a dropped option stops applying; only keys selected inside an
            // uncontrolled table are carried over
            const newSelectionStates: TableBaseStateRowSelection<R> = isObject(rowSelection) ? { ...rowSelection } : rowSelection ? {} : null;
            const selectedRowKeys = isObject(rowSelection) ? rowSelection.selectedRowKeys : undefined;
            const getCheckboxProps = isObject(rowSelection) ? rowSelection.getCheckboxProps : undefined;
            if (newSelectionStates) {
                if (Array.isArray(selectedRowKeys)) {
                    newSelectionStates.selectedRowKeysSet = new Set(selectedRowKeys);
                } else if (isObject(state.prePropRowSelection) && Array.isArray(state.prePropRowSelection.selectedRowKeys)) {
                    // a withdrawn controlled value leaves nothing selected rather than the last value
                    newSelectionStates.selectedRowKeys = [];
                    newSelectionStates.selectedRowKeysSet = new Set();
                } else if (state.rowSelection) {
                    newSelectionStates.selectedRowKeys = state.rowSelection.selectedRowKeys;
                    newSelectionStates.selectedRowKeysSet = state.rowSelection.selectedRowKeysSet;
                }
            }
            // both scopes get the whole dataSource's keys, a superset the disabled checks tolerate
            if (typeof getCheckboxProps === 'function') {
                const disabledRowKeys = TableFoundation.getAllDisabledRowKeys(props, dataSource, getCheckboxProps);
                const disabledRowKeysSet = new Set(disabledRowKeys);
                changes.pageDisabledRowKeys = disabledRowKeys;
                changes.pageDisabledRowKeysSet = disabledRowKeysSet;
                changes.filteredDisabledRowKeys = disabledRowKeys;
                changes.filteredDisabledRowKeysSet = disabledRowKeysSet;
            }
            const halfCheckedRowKeys = newSelectionStates?.checkRelation === 'related' ? TableFoundation.#getRelatedCheckedRowKeys(newSelectionStates.selectedRowKeys, state.keyEntities).halfCheckedRowKeys : [];
            changes.halfCheckedRowKeys = halfCheckedRowKeys;
            changes.halfCheckedRowKeysSet = new Set(halfCheckedRowKeys);
            changes.rowSelection = newSelectionStates;
            changes.prePropRowSelection = rowSelection;
        }

        if (pagination !== state.prePagination) {
            // the pager position and the computed total carry over; options dropped from the prop, onChange among them,
            // stop applying
            changes.pagination = {
                ...(isObject(state.pagination) ? pick(state.pagination, ['currentPage', 'pageSize', 'total']) : {}),
                ...(isObject(pagination) ? pagination : {}),
            };
            changes.prePagination = pagination;
        }

        if (expandedRowKeys !== state.preExpandedRowKeys) {
            if (Array.isArray(expandedRowKeys)) {
                changes.expandedRowKeys = expandedRowKeys;
            } else if (Array.isArray(state.preExpandedRowKeys)) {
                changes.expandedRowKeys = [];
            }
            changes.preExpandedRowKeys = expandedRowKeys;
        }

        return Object.keys(changes).length ? changes : null;
    }

    /**
     * @param queries copies of flattenColumns with initColumnsFilteredValueAndSorterOrder applied; the framework copies
     * them, since a deep clone would break framework values held by a column
     */
    static getInitialState<R, C extends BaseColumnProps<R> = BaseColumnProps<R>>(props: TableBaseProps<R>, flattenColumns: C[], queries: C[]): TableColumnsState<R, C> {
        const filteredSortedDataSource = TableFoundation.getFilteredSortedDataSource(props, props.dataSource, queries);
        const filteredSortedRowKeys = TableFoundation.getAllRowKeys(props, filteredSortedDataSource);
        const pageData = TableFoundation.getPageData(props, filteredSortedDataSource, isObject(props.pagination) ? props.pagination : {}, queries);
        const related = isObject(props.rowSelection) && props.rowSelection.checkRelation === 'related';
        const state: TableColumnsState<R, C> = {
            flattenColumns,
            queries,
            dataSource: pageData.dataSource,
            expandedRowKeys: [...(props.expandedRowKeys || []), ...(props.defaultExpandedRowKeys || [])],
            preExpandedRowKeys: props.expandedRowKeys,
            rowSelection: props.rowSelection ? (isObject(props.rowSelection) ? { ...props.rowSelection } : {}) : null,
            pagination: pageData.pagination,
            groups: pageData.groups ?? null,
            allRowKeys: pageData.allRowKeys,
            pageDisabledRowKeys: [],
            pageDisabledRowKeysSet: new Set(),
            filteredDisabledRowKeys: [],
            filteredDisabledRowKeysSet: new Set(),
            headWidths: [],
            bodyHasScrollBar: false,
            prePropRowSelection: undefined,
            prePagination: undefined,
            halfCheckedRowKeys: [],
            halfCheckedRowKeysSet: new Set(),
            keyEntities: related && props.dataSource?.length ? TableFoundation.buildKeyEntities(props, props.dataSource) : {},
            filteredSortedDataSource,
            filteredSortedRowKeys,
            filteredSortedRowKeysSet: new Set(filteredSortedRowKeys),
        };
        const filteredDisabledRowKeys = TableFoundation.getAllDisabledRowKeys(props, filteredSortedDataSource);
        // the disabled keys deriveState takes from the whole dataSource give way to those of the page and of the
        // filtered rows
        return {
            ...state,
            ...TableFoundation.deriveState(props, state, flattenColumns),
            pageDisabledRowKeys: pageData.disabledRowKeys,
            pageDisabledRowKeysSet: new Set(pageData.disabledRowKeys),
            filteredDisabledRowKeys,
            filteredDisabledRowKeysSet: new Set(filteredDisabledRowKeys),
        };
    }

    /** Hosts call it after mount, on body scroll and when the table or its content resizes */
    syncScrollEdges = () => {
        // probed on first use, which hosts only reach after mount, so SSR never touches CSS
        this.#trackScrollEdges ??= !CSS.supports('container-type', 'scroll-state');
        const body = this.#trackScrollEdges ? this.adapter.getBodyWrapper() : null;
        if (body) {
            TableFoundation.#syncScrollableEdges(body);
        }
    };

    /** `index` is the header row the widths were measured in */
    setHeadWidths = (widths: BaseHeadWidth[], index = 0) => {
        const prevHeadWidths = this.getState('headWidths') ?? [];
        if (!isEqual(prevHeadWidths[index], widths)) {
            const nextHeadWidths = [...prevHeadWidths];
            nextHeadWidths[index] = [...widths];
            this.setState({ headWidths: nextHeadWidths });
        }
    };

    setBodyHasScrollbar = (bodyHasScrollBar: boolean) => {
        if (bodyHasScrollBar !== this.getState('bodyHasScrollBar')) {
            this.setState({ bodyHasScrollBar });
        }
    };

    override handlePropsChange(prev: Partial<P>) {
        // render already shows the derived state; written here first, since the update below builds on it
        const derived = TableFoundation.deriveState(this.getProps(), this.getStates(), this.getProp('flattenColumns'));
        if (derived) {
            this.setState(derived);
        }

        const props = this.getProps();
        const flattenColumns = this.getState('flattenColumns');

        if (
            // a local filter keeps its matches by key, so records without one silently collapse into one row
            (props.rowSelection || props.expandedRowRender || flattenColumns.some((column) => column.onFilter)) &&
            props.dataSource?.some((record) => TableFoundation.getRecordKey(props, record) == null)
        ) {
            if (isDev()) {
                console.error('[Semi Table] You must specify a key for each element in the dataSource or use "rowKey" to specify an attribute name as the primary key!');
            }
        }

        if (props.flattenColumns !== prev.flattenColumns) {
            this.#warnMissingDataIndex();
        }

        if (props.expandAllRows !== prev.expandAllRows || props.expandAllGroupRows !== prev.expandAllGroupRows) {
            this.initExpandedRowKeys({ groups: this.getState('groups') });
        }

        const dataSourceChanged = props.dataSource !== prev.dataSource;
        const recompute = dataSourceChanged || flattenColumns !== prev.flattenColumns;
        // an unrelated selection keeps no tree
        const becameRelated = this.#getCheckRelation() === 'related' && !(isObject(prev.rowSelection) && prev.rowSelection.checkRelation === 'related');
        if (becameRelated && !recompute) {
            this.#updateKeyEntities();
        }
        // sorting and filtering recompute in their own handlers and disabled keys in deriveState
        this.#handleDataUpdate(dataSourceChanged, recompute, prev.pagination);
    }

    initExpandedRowKeys({ groups }: { groups?: Map<string | number, Set<BaseRowKeyType>> } = {}) {
        const { defaultExpandAllRows, defaultExpandedRowKeys = [], expandedRowKeys: propExpandedRowKeys = [], dataSource = [], expandAllRows, defaultExpandAllGroupRows, expandAllGroupRows } = this.getProps();
        const expandedRowKeys: BaseRowKeyType[] = [];

        if (defaultExpandAllRows || expandAllRows) {
            this.#addNoDuplicatedItemsToArr(expandedRowKeys, this.getAllRowKeys(dataSource), groups && groups instanceof Map && groups.size ? Array.from(groups.keys()) : []);
        } else if (defaultExpandAllGroupRows || expandAllGroupRows) {
            this.#addNoDuplicatedItemsToArr(expandedRowKeys, propExpandedRowKeys, groups && groups instanceof Map && groups.size ? Array.from(groups.keys()) : []);
        } else if (Array.isArray(defaultExpandedRowKeys) && defaultExpandedRowKeys.length) {
            this.#addNoDuplicatedItemsToArr(expandedRowKeys, defaultExpandedRowKeys);
        } else if (Array.isArray(propExpandedRowKeys) && propExpandedRowKeys.length) {
            this.#addNoDuplicatedItemsToArr(expandedRowKeys, propExpandedRowKeys);
        }
        this.setState({ expandedRowKeys });
    }

    /** The rows and groups of the current page as the foundation keeps them; the host clones them before handing them out */
    getCurrentPageData = (): Pick<BasePageData<RecordType>, 'dataSource' | 'groups'> => {
        const { dataSource, groups } = this.#getPageData();
        return { ...(dataSource && { dataSource }), ...(groups && { groups }) };
    };

    /** Pagination's onChange: a pagination.onChange of the user's takes over paging, still with the scrollToFirstRowOnChange scroll */
    handlePageChange = (currentPage: number, pageSize: number) => {
        if (typeof (this.getProp('pagination') as BasePagination)?.onChange !== 'function') {
            this.setPage(currentPage, pageSize);
            return;
        }
        if (this.getProp('scroll')?.scrollToFirstRowOnChange) {
            this.#resetScrollY();
        }
        this.adapter.notifyPageChange(currentPage, pageSize);
    };

    setPage = (currentPage: number, currentPageSize: number) => {
        const currentPagination = this.getState('pagination');
        currentPage = currentPage || (currentPagination?.currentPage ?? 1);
        const { dataSource, pagination, disabledRowKeys, allRowKeys } = this.#getPageData(null, {
            ...currentPagination,
            currentPage,
            pageSize: currentPageSize,
        });
        if (!TableFoundation.#pagerIsControlled(this.getProps()) && currentPage > 0) {
            this.#setPageDisabledRowKeys(disabledRowKeys);
            this.setState({ allRowKeys, pagination, dataSource });
        }

        this.#notifyChange(pagination, undefined, undefined, { changeType: 'pagination' });
    };

    // Firefox leaves shiftKey false on the click (detail 0) that a Space keyup fires on a checkbox, so the selection
    // cell reports the keyup here and handleSelectRow reads its Shift state
    handleSelectionKeyUp = (e: Pick<KeyboardEvent, 'key' | 'shiftKey'>) => {
        if (e.key === ' ') {
            this.#spaceShiftKey = e.shiftKey;
        }
    };

    handleSelectRow = (realKey: BaseRowKeyType, selected: boolean, e?: BaseSelectRowEvent) => {
        e?.stopPropagation();
        if (typeof selected === 'boolean' && realKey != null) {
            const checkRelation = this.#getCheckRelation();
            // a related tree checks whole subtrees, so a Shift range has no clear meaning there
            const native = e?.nativeEvent;
            const shiftKey = e?.shiftKey ?? (native?.shiftKey || (native?.detail === 0 && this.#spaceShiftKey));
            this.#spaceShiftKey = false;
            if (shiftKey && checkRelation !== 'related' && this.#rangeAnchor != null && this.#selectRange(realKey)) {
                return;
            }
            this.#rangeAnchor = realKey;
            this.#rangeResult = null;

            const selectedRowKeys = this.#getSelectedRowKeys();
            const halfCheckedRowKeys = [...(this.getState('halfCheckedRowKeys') ?? [])];
            let foundIdx = -1;
            const selectedRow = this.getRecordsByKeys(null, [realKey])[0];
            let selectedRows: BaseIncludeGroupRecord<RecordType>[];

            if (checkRelation === 'related') {
                const checkedKeysSet = new Set(selectedRowKeys.map((key) => String(key)));
                const halfCheckedKeysSet = new Set(halfCheckedRowKeys.map((key) => String(key)));

                const { checkedKeys, halfCheckedKeys } = this.calcCheckedKeysForSelect(String(realKey), selected, checkedKeysSet, halfCheckedKeysSet);

                const keyEntities = this.getState('keyEntities') ?? {};
                const newSelectedRowKeys = TableFoundation.#restoreRowKeys(checkedKeys, [...selectedRowKeys, realKey], keyEntities);
                const newHalfCheckedRowKeys = TableFoundation.#restoreRowKeys(halfCheckedKeys, halfCheckedRowKeys, keyEntities);
                selectedRows = this.getRecordsByKeys(null, newSelectedRowKeys);

                // a controlled selection derives its half-checked rows from the keys the parent passes back
                if (!this.#selectionIsControlled()) {
                    this.#setSelectedRowKeys(newSelectedRowKeys);
                    this.#setHalfCheckedRowKeys(newHalfCheckedRowKeys);
                }
                this.adapter.notifySelect(selectedRow, selected, selectedRows, e);
                this.adapter.notifySelectionChange(newSelectedRowKeys, selectedRows);
            } else {
                if ((foundIdx = selectedRowKeys.indexOf(realKey)) > -1 && selected === false) {
                    selectedRowKeys.splice(foundIdx, 1);
                    selectedRows = this.getRecordsByKeys(null, selectedRowKeys);
                    if (!this.#selectionIsControlled()) {
                        this.#setSelectedRowKeys(selectedRowKeys);
                    }
                    this.adapter.notifySelect(selectedRow, selected, selectedRows, e);
                    this.adapter.notifySelectionChange(selectedRowKeys, selectedRows);
                } else if (selectedRowKeys.indexOf(realKey) === -1 && selected === true) {
                    selectedRowKeys.push(realKey);
                    selectedRows = this.getRecordsByKeys(null, selectedRowKeys);
                    if (!this.#selectionIsControlled()) {
                        this.#setSelectedRowKeys(selectedRowKeys);
                    }
                    this.adapter.notifySelect(selectedRow, selected, selectedRows, e);
                    this.adapter.notifySelectionChange(selectedRowKeys, selectedRows);
                }
            }
        }
    };

    handleSelectAllRow = (selected: boolean, e?: Pick<Event, 'stopPropagation'>) => {
        e?.stopPropagation();
        if (typeof selected === 'boolean') {
            const checkRelation = this.#getCheckRelation();
            const curSelectedRowKeys = this.#getSelectedRowKeys();
            let selectedRowKeys = [...curSelectedRowKeys];
            const selectedRowKeysSet = this.#getSelectedRowKeysSet();
            const disabledRowKeysSet = this.#getFilteredDisabledRowKeysSet();
            const scopeRowKeys = (this.getState('filteredSortedRowKeys') ?? []).filter((key) => !disabledRowKeysSet.has(key));

            if (checkRelation === 'related') {
                const keyEntities = this.getState('keyEntities') ?? {};
                const halfCheckedRowKeys = [...(this.getState('halfCheckedRowKeys') ?? [])];
                let checkedKeysSet = new Set(selectedRowKeys.map((key) => String(key)));
                let halfCheckedKeysSet = new Set(halfCheckedRowKeys.map((key) => String(key)));

                if (selected) {
                    if (keyEntities) {
                        const result = calcCheckedKeysForCheckedKeys(
                            scopeRowKeys.map((key) => String(key)),
                            keyEntities,
                            checkedKeysSet,
                            halfCheckedKeysSet
                        );
                        checkedKeysSet = result.checkedKeys;
                        halfCheckedKeysSet = result.halfCheckedKeys;
                    }
                } else {
                    // unchecking a key also unchecks its descendants, so each key is rechecked in turn
                    for (const key of scopeRowKeys.map((rowKey) => String(rowKey))) {
                        if (checkedKeysSet.has(key) && keyEntities && keyEntities[key]) {
                            const result = calcCheckedKeysForUnchecked(key, keyEntities, checkedKeysSet, halfCheckedKeysSet);
                            checkedKeysSet = result.checkedKeys;
                            halfCheckedKeysSet = result.halfCheckedKeys;
                        }
                    }
                }

                selectedRowKeys = TableFoundation.#restoreRowKeys(checkedKeysSet, [...curSelectedRowKeys, ...scopeRowKeys], keyEntities);
                const newHalfCheckedRowKeys = TableFoundation.#restoreRowKeys(halfCheckedKeysSet, halfCheckedRowKeys, keyEntities);
                const changedRows = this.getRecordsByKeys(null, getChangedRowKeys(curSelectedRowKeys, selectedRowKeys));
                const selectedRows = this.getRecordsByKeys(null, selectedRowKeys || []);

                if (!this.#selectionIsControlled()) {
                    this.#setSelectedRowKeys(selectedRowKeys);
                    this.#setHalfCheckedRowKeys(newHalfCheckedRowKeys);
                }
                this.adapter.notifySelectAll(selected, selectedRows, changedRows, e);
                this.adapter.notifySelectionChange(selectedRowKeys, selectedRows);
            } else {
                if (selected) {
                    for (const key of scopeRowKeys) {
                        if (!selectedRowKeysSet.has(key)) {
                            selectedRowKeys.push(key);
                        }
                    }
                } else {
                    selectedRowKeys = differenceUnique(selectedRowKeys, scopeRowKeys);
                }

                const changedRows = this.getRecordsByKeys(null, getChangedRowKeys(curSelectedRowKeys, selectedRowKeys));
                const selectedRows = this.getRecordsByKeys(null, selectedRowKeys || []);

                if (!this.#selectionIsControlled()) {
                    this.#setSelectedRowKeys(selectedRowKeys);
                }
                this.adapter.notifySelectAll(selected, selectedRows, changedRows, e);
                this.adapter.notifySelectionChange(selectedRowKeys, selectedRows);
            }
        }
    };

    handleRowExpanded = (expanded: boolean, realKey: BaseRowKeyType, domEvent: any) => {
        domEvent?.stopPropagation();

        const expandedRowKeys = [...this.getState('expandedRowKeys')];

        const index = expandedRowKeys.indexOf(realKey);
        const keyIsValid = typeof realKey === 'string' || typeof realKey === 'number';

        if (keyIsValid && expanded && index === -1) {
            expandedRowKeys.push(realKey);
        } else if (keyIsValid && !expanded && index > -1) {
            expandedRowKeys.splice(index, 1);
        }

        if (!this.#rowExpansionIsControlled()) {
            this.setState({ expandedRowKeys: [...expandedRowKeys] });
        }

        const expandedRows = this.getRecordsByKeys(null, expandedRowKeys);
        let expandedRow = this.getRecordsByKeys(null, [realKey])[0];

        const groups = this.#getGroups();
        if (groups) {
            if (groups.has(realKey)) {
                expandedRow = { groupKey: realKey };
            }

            for (const groupKey of expandedRowKeys) {
                if (groups.has(groupKey)) {
                    expandedRows.push({ groupKey });
                }
            }
        }

        this.adapter.notifyExpand(expanded, expandedRow, domEvent);
        this.adapter.notifyExpandedRowsChange(expandedRows, [...expandedRowKeys]);
    };

    toggleShowFilter = (dataIndex: string, visible: boolean) => {
        const column = dataIndex ? this.getQuery(dataIndex) : undefined;
        if (column) {
            this.adapter.notifyFilterDropdownVisibleChange(column, visible);
        }
    };

    handleFilterSelect = (dataIndex: string, data: { filteredValue?: string[] } = {}) => {
        const query: BaseColumnProps<RecordType> = { ...this.getQuery(dataIndex), filteredValue: data.filteredValue };
        const queries = this.#mergeToQueries(query, null);
        const filters = this.#getAllFilters(queries);
        // onChange reports the pagination and sorter from before this filter
        const pagination = this.#getPagination();
        const sorter = this.#getAllSorters()[0] as BaseChangeInfoSorter<RecordType>;

        if (!this.#filterIsControlled(dataIndex)) {
            this.setState({ queries });
            this.#applyQueries(queries);
        }

        this.#notifyChange(pagination, filters, sorter, { changeType: 'filter' });
    };

    // no stopPropagation: it would block an onHeaderCell click handler when the whole title is clickable
    handleSort = ({ dataIndex }: { dataIndex?: string; sortOrder?: BaseSortOrder } = {}) => {
        let queries = this.getState('queries');
        let curQuery = null;

        queries = [...queries];

        queries.forEach((query, idx, arr) => {
            if (query.sorter) {
                const sorterObj = { ...query };

                const stateSortOrder = sorterObj.sortOrder;
                const defaultSortOrder = sorterObj.defaultSortOrder ?? false;
                let querySortOrder = TableFoundation.isSortOrderValid(stateSortOrder) ? stateSortOrder : defaultSortOrder;

                if (dataIndex && dataIndex === sorterObj.dataIndex) {
                    if (querySortOrder === strings.SORT_DIRECTIONS[0]) {
                        querySortOrder = strings.SORT_DIRECTIONS[1];
                    } else if (querySortOrder === strings.SORT_DIRECTIONS[1]) {
                        querySortOrder = false;
                    } else {
                        querySortOrder = strings.SORT_DIRECTIONS[0];
                    }
                } else {
                    querySortOrder = false;
                }

                arr[idx] = { ...sorterObj, sortOrder: querySortOrder };

                if (dataIndex === sorterObj.dataIndex) {
                    curQuery = arr[idx];
                }
            }
        });

        // onChange reports the pagination and filters from before this sort
        const pagination = this.#getPagination();
        const filters = this.#getAllFilters();

        if (!this.#sorterIsControlled(dataIndex)) {
            this.setState({ queries });
            this.#applyQueries(queries);
        }

        this.#notifyChange(pagination, filters, curQuery, { changeType: 'sorter' });
    };

    handleRowClickSelection = (rowKey: BaseRowKeyType, selected: boolean, e: BaseSelectRowEvent) => {
        const rowSelection = this.getState('rowSelection');

        if (rowSelection?.clickRow && !rowSelection.disabled) {
            const getCheckboxProps = rowSelection?.getCheckboxProps;
            const record = (this.getState('filteredSortedDataSource') ?? []).find((r: RecordType) => this.getRecordKey(r) === rowKey);

            if (record && typeof getCheckboxProps === 'function' && getCheckboxProps(record).disabled) {
                return;
            }

            this.handleSelectRow(rowKey, selected, e);
        }
    };
}

export type BaseRowKeyType = string | number;
/** A row click passes its mouse event; a checkbox change passes its change event, with the click in nativeEvent */
export interface BaseSelectRowEvent {
    stopPropagation: () => void;
    shiftKey?: boolean;
    nativeEvent?: { shiftKey?: boolean; detail?: number };
}
export type BaseRowKey<RecordType> = BaseRowKeyType | ((record: RecordType) => BaseRowKeyType);
export interface BasePagination {
    total?: number;
    currentPage?: number;
    pageSize?: number;
    position?: ArrayElement<typeof strings.PAGINATION_POSITIONS>;
    defaultCurrentPage?: number;
    formatPageText?: any;
    onChange?: (currentPage: number, pageSize: number) => void;
}
export interface BaseHeadWidth {
    width: number;
    key: string;
}
export interface BasePageData<RecordType> {
    dataSource?: RecordType[];
    groups?: Map<string | number, Set<BaseRowKeyType>>;
    pagination?: BasePagination;
    disabledRowKeys?: BaseRowKeyType[];
    allRowKeys?: BaseRowKeyType[];
    queries?: BaseColumnProps<RecordType>[];
}

export type GetCheckboxProps<RecordType> = (record?: RecordType) => BaseCheckboxProps;
export type BaseGroupBy<RecordType> = string | number | BaseGroupByFn<RecordType>;
export type BaseGroupByFn<RecordType> = (record?: RecordType) => string | number;
export interface BaseSorterInfo<RecordType> {
    dataIndex?: string;
    sortOrder?: BaseSortOrder;
    defaultSortOrder?: BaseSortOrder;
    sorter?: BaseSorter<RecordType>;
    sortChildrenRecord?: boolean;
}
export type BaseSortOrder = boolean | ArrayElement<typeof strings.SORT_DIRECTIONS>;
export type BaseSorter<RecordType> = boolean | ((a: RecordType, b: RecordType, sortOrder?: 'ascend' | 'descend') => number);
export interface BaseChangeInfoFilter<RecordType> {
    dataIndex?: string;
    value?: any;
    text?: any;
    filters?: BaseFilter[];
    onFilter?: BaseOnFilter<RecordType>;
    filteredValue?: any[];
    defaultFilteredValue?: any[];
    children?: BaseFilter[];
    filterChildrenRecord?: boolean;
}
export interface BaseFilter {
    value?: any;
    text?: any;
    children?: BaseFilter[];
}
export type BaseFixed = ArrayElement<typeof strings.FIXED_SET>;
export type BaseAlign = ArrayElement<typeof strings.ALIGNS>;
export type BaseOnCell<RecordType> = (record?: RecordType, rowIndex?: number) => BaseOnCellReturnObject;
export interface BaseOnCellReturnObject {
    style?: Record<string, any>;
    className?: string;
    onClick?: (e: any) => void;
}
export type BaseOnFilter<RecordType> = (filteredValue: any, record: RecordType) => boolean;

export type BaseOnFilterDropdownVisibleChange = (visible?: boolean) => void;

export interface BaseChangeInfoSorter<RecordType> {
    dataIndex: string;
    sortOrder: BaseSortOrder;
    sorter: BaseSorter<RecordType>;
}

export interface ColumnFlags<Q extends { filteredValue?: unknown }> {
    hasSorter: boolean;
    hasFilter: boolean;
    /** The title gets the sorter, the filter or the useFullRender parts */
    needsTitle: boolean;
    clickToSort: boolean;
    showSortTip: boolean;
    query: Q | undefined;
    sortOrder: BaseSortOrder;
    filteredValue: Q['filteredValue'];
}

export type BaseIncludeGroupRecord<RecordType> = RecordType | { groupKey: string | number };

export type BaseEllipsis = boolean | { showTitle: boolean };

export type CheckRelation = 'related' | 'unRelated';

export interface BaseEntity {
    key?: string | number;
    level?: number;
    children?: BaseEntity[];
    parent?: BaseEntity | null;
    data?: Record<string, any>;
}

export interface BaseEntitys {
    [key: string]: BaseEntity;
}
