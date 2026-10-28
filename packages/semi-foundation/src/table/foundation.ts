import { merge, pick } from 'es-toolkit';
// compat get resolves deep path strings such as 'a.b'
import { get } from 'es-toolkit/compat';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { BaseCheckboxProps } from '../checkbox/checkbox-foundation';
import { convertDataToEntities, calcCheckedKeysForChecked, calcCheckedKeysForCheckedKeys, calcCheckedKeysForUnchecked } from '../tree/tree-util';
import { differenceUnique, withOrderSort } from '../utils/array';
import isObject from '../utils/is-object';
import type { ArrayElement } from '../utils/type';
import { isDev } from '../utils/warning';
import { strings, numbers } from './constants';
import { getChangedRowKeys, mergeColumns } from './utils';

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

export interface TableAdapter<RecordType, P extends TableBaseProps<RecordType> = TableBaseProps<RecordType>, S extends TableBaseState<RecordType> = TableBaseState<RecordType>> extends DefaultAdapter<P, S> {
    resetScrollY: () => void;
    /** The metrics of the body scroller, or null while it is not mounted */
    getScrollMetrics: () => TableScrollMetrics | null;
    setScrollableEdges: (edges: TableScrollableEdges) => void;
    setSelectedRowKeys: (selectedRowKeys: BaseRowKeyType[]) => void;
    setPageDisabledRowKeys: (pageDisabledRowKeys: BaseRowKeyType[]) => void;
    setPagination: (pagination: BasePagination) => void;
    setGroups: (groups: Map<string | number, Set<BaseRowKeyType>>) => void;
    setDataSource: (dataSource: RecordType[]) => void;
    setExpandedRowKeys: (expandedRowKeys: BaseRowKeyType[]) => void;
    // method syntax keeps the parameter bivariant: the queries are the framework's own column objects
    setQueries(queries: BaseColumnProps<RecordType>[]): void;
    setAllRowKeys: (allRowKeys: BaseRowKeyType[]) => void;
    setCachedFilteredSortedDataSource: (filteredSortedDataSource: RecordType[]) => void;
    setCachedFilteredSortedRowKeys: (filteredSortedRowKeys: BaseRowKeyType[]) => void;
    setHalfCheckedRowKeys: (halfCheckedRowKeys: BaseRowKeyType[]) => void;
    setKeyEntities: (keyEntities: BaseEntitys) => void;
    getCurrentPage: () => number;
    getCachedFilteredSortedDataSource: () => RecordType[];
    getCachedFilteredSortedRowKeys: () => BaseRowKeyType[];
    setFilteredDisabledRowKeys: (filteredDisabledRowKeys: BaseRowKeyType[]) => void;
    getFilteredDisabledRowKeysSet: () => Set<BaseRowKeyType>;
    getHalfCheckedRowKeys: () => BaseRowKeyType[];
    getKeyEntities: () => BaseEntitys;
    notifyFilterDropdownVisibleChange: (visible: boolean, dataIndex: string) => void;
    notifyChange: (changeInfo: { pagination: BasePagination; filters: BaseChangeInfoFilter<RecordType>[]; sorter: BaseChangeInfoSorter<RecordType>; extra: OnChangeExtra }) => void;
    notifyExpand: (expanded: boolean, record: BaseIncludeGroupRecord<RecordType>, mouseEvent: any) => void;
    /** expandedRowKeys is the next expansion, group keys included */
    notifyExpandedRowsChange: (expandedRows: BaseIncludeGroupRecord<RecordType>[], expandedRowKeys: BaseRowKeyType[]) => void;
    notifySelect: (record: BaseIncludeGroupRecord<RecordType>, selected: boolean, selectedRows: BaseIncludeGroupRecord<RecordType>[], event: any) => void;
    notifySelectAll: (selected: boolean, selectedRows: BaseIncludeGroupRecord<RecordType>[], changedRows: BaseIncludeGroupRecord<RecordType>[], e: any) => void;
    notifySelectionChange: (selectedRowKeys: BaseRowKeyType[], selectedRows: BaseIncludeGroupRecord<RecordType>[]) => void;
    getCheckRelation: () => CheckRelation;
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

/** The rowSelection options the foundation reads */
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
    scroll?: { scrollToFirstRowOnChange?: boolean };
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
    /** Disabled row keys of the current page */
    pageDisabledRowKeys?: BaseRowKeyType[];
    pageDisabledRowKeysSet?: Set<BaseRowKeyType>;
    headWidths?: BaseHeadWidth[][];
    bodyHasScrollBar?: boolean;
    /** The props the derived state was last computed from */
    prePropRowSelection?: TableBaseProps<RecordType>['rowSelection'];
    prePagination?: TableBaseProps<RecordType>['pagination'];
    preExpandedRowKeys?: BaseRowKeyType[];
    /** Disabled row keys in sorted and filtered data */
    filteredDisabledRowKeys?: BaseRowKeyType[];
    filteredDisabledRowKeysSet?: Set<BaseRowKeyType>;
    /** Half-checked row keys for tree selection (checkRelation='related') */
    halfCheckedRowKeys?: BaseRowKeyType[];
    halfCheckedRowKeysSet?: Set<BaseRowKeyType>;
    /** Key entities map for tree data structure */
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

export default class TableFoundation<RecordType, P extends TableBaseProps<RecordType> = TableBaseProps<RecordType>, S extends TableBaseState<RecordType> = TableBaseState<RecordType>> extends BaseFoundation<TableAdapter<RecordType, P, S>, P, S> {
    // StrictMode and React Activity replay init on this instance after destroy, over rows the user may have expanded
    // or selected since: the expansion and selection defaults apply once. The rest of init still runs every time, since
    // the Vue host calls it again once the child columns are known.
    // shortcut: these defaults belong in getInitialState, which needs the key entities and groups resolved statically;
    // move them there when the state of both hosts is created from it.
    #defaultKeysApplied = false;

    // Without `scroll-state` container queries (Chrome < 133) the fixed-column shadows follow data attributes written by
    // syncScrollEdges. Removable once Firefox and Safari support `container-type: scroll-state`.
    #trackScrollEdges: boolean | undefined;

    static #pagerIsControlled(props: { pagination?: BasePagination | boolean }) {
        return (props.pagination as BasePagination)?.currentPage != null;
    }

    // maps the tree utilities' string keys back to the user's rowKey values; `known` covers keys without an entity
    static #restoreRowKeys(keys: Iterable<string>, known: BaseRowKeyType[], keyEntities?: BaseEntitys): BaseRowKeyType[] {
        const knownMap = new Map(known.map((key) => [String(key), key]));
        return [...keys].map((key) => keyEntities?.[key]?.data?.rowKey ?? knownMap.get(key) ?? key);
    }

    /** The checked and half-checked keys that `rowKeys` imply in a related tree selection, as the rowKey values of the data */
    static #getRelatedCheckedRowKeys(rowKeys: BaseRowKeyType[] = [], keyEntities: BaseEntitys = {}) {
        const { checkedKeys, halfCheckedKeys } = calcCheckedKeysForCheckedKeys(rowKeys.map(String), keyEntities, new Set(), new Set());
        return { checkedRowKeys: TableFoundation.#restoreRowKeys(checkedKeys, rowKeys, keyEntities), halfCheckedRowKeys: TableFoundation.#restoreRowKeys(halfCheckedKeys, rowKeys, keyEntities) };
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
            this._adapter.resetScrollY();
        }
        this._adapter.notifyChange({
            pagination: { ...pagination },
            filters: [...filters],
            sorter,
            extra: { ...extra },
        });
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
        return Boolean(query && query.sortOrder != null);
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
        const groupBy = this._adapter.getProp('groupBy');
        if (groupBy !== null) {
            const groups = this._adapter.getState('groups');
            return groups;
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
            if (this._adapter.getCheckRelation() === 'related') {
                const related = TableFoundation.#getRelatedCheckedRowKeys(rowKeys, keyEntities);
                halfCheckedRowKeys = related.halfCheckedRowKeys;
                if (!controlled) {
                    // default keys check descendants and parents as a click would; keys outside the data stay
                    const known = new Set(rowKeys.map(String));
                    rowKeys = [...rowKeys, ...related.checkedRowKeys.filter((key) => !known.has(String(key)))];
                }
            }

            this._adapter.setSelectedRowKeys(rowKeys);
            this._adapter.setHalfCheckedRowKeys(halfCheckedRowKeys);
        }
    }

    #setAdapterPageData({ pagination, dataSource, disabledRowKeys, allRowKeys, groups }: BasePageData<RecordType> = {}) {
        this._adapter.setPageDisabledRowKeys(disabledRowKeys);
        this._adapter.setAllRowKeys(allRowKeys);
        this._adapter.setPagination(pagination);
        this._adapter.setGroups(groups);
        this._adapter.setDataSource(dataSource);
    }

    #setCachedFilteredSortedDataSource(filteredSortedDataSource: RecordType[]) {
        this._adapter.setCachedFilteredSortedDataSource(filteredSortedDataSource);
        const filteredSortedRowKeys = this.getAllRowKeys(filteredSortedDataSource);
        this._adapter.setCachedFilteredSortedRowKeys(filteredSortedRowKeys);
    }

    #setFilteredDisabledRowKeys(disabledRowKeys: BaseRowKeyType[]) {
        this._adapter.setFilteredDisabledRowKeys(disabledRowKeys);
    }

    #applyQueries(queries: BaseColumnProps<RecordType>[]) {
        const dataSource = [...this.getProp('dataSource')];
        const sortedDataSource = this.getFilteredSortedDataSource(dataSource, queries);
        const allDataDisabledRowKeys = this.getAllDisabledRowKeys(sortedDataSource);
        this.#setCachedFilteredSortedDataSource(sortedDataSource);
        this.#setFilteredDisabledRowKeys(allDataDisabledRowKeys);
        const pageData = this.getCurrentPageData(sortedDataSource);
        this.#setAdapterPageData(pageData);
    }

    /** Rebuilds the tree of a related selection; the half-checked rows follow from it and the selected keys */
    #updateKeyEntities() {
        const keyEntities = this.buildKeyEntities(this.getProp('dataSource'));
        this._adapter.setKeyEntities(keyEntities);
        this._adapter.setHalfCheckedRowKeys(TableFoundation.#getRelatedCheckedRowKeys(this.#getSelectedRowKeys(), keyEntities).halfCheckedRowKeys);
    }

    /**
     * @param dataSourceChanged the dataSource prop changed: the uncontrolled page goes back to 1
     * @param recompute the dataSource prop or the columns changed
     */
    #handleDataUpdate(dataSourceChanged: boolean, recompute: boolean) {
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

            if (this._adapter.getCheckRelation() === 'related') {
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

        if (Object.keys(states).length) {
            const pageData = this.getCurrentPageData(states.dataSource ?? null, states.pagination ?? (statePagination && { ...statePagination }), null);

            this._adapter.setAllRowKeys(pageData.allRowKeys);
            this._adapter.setPageDisabledRowKeys(pageData.disabledRowKeys);

            if ('dataSource' in states) {
                // groups recompute with the columns too; only new data, which may bring new groups, expands them again
                const expandNewGroups = defaultExpandAllRows && dataSourceChanged && pageData.groups?.size && !this.#rowExpansionIsControlled();
                if (expandNewGroups || expandAllRows || expandAllGroupRows) {
                    this.initExpandedRowKeys(pageData);
                }
                this._adapter.setDataSource(pageData.dataSource);
                states.pagination = pageData.pagination;
            }
            if ('groups' in states) {
                this._adapter.setGroups(pageData.groups);
            }
            if ('pagination' in states) {
                this._adapter.setPagination(pageData.pagination);
            }
        }
    }

    protected getFilteredSortedDataSource(dataSource: RecordType[], queries: BaseColumnProps<RecordType>[]) {
        return TableFoundation.getFilteredSortedDataSource(this.getProps(), dataSource, queries);
    }

    protected getRecordKey(record: RecordType): BaseRowKeyType {
        return TableFoundation.getRecordKey({ rowKey: this.getProp('rowKey') }, record);
    }

    protected buildKeyEntities(dataSource?: RecordType[]): BaseEntitys {
        dataSource = dataSource == null ? this.#getDataSource() : dataSource;
        const childrenRecordName = this.getProp('childrenRecordName');
        const rowKey = this.getProp('rowKey');

        const convertToTreeData = (data: RecordType[]) => {
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

        const treeData = convertToTreeData(dataSource);
        const { keyEntities } = convertDataToEntities(treeData, { key: 'key', children: 'children' });
        return keyEntities;
    }

    protected calcCheckedKeysForSelect(realKey: BaseRowKeyType, selected: boolean, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
        const keyEntities = this._adapter.getKeyEntities();
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

    /**
     * Group, paginate and collect the row keys of filtered and sorted data
     */
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

    /** scrollLeft is 0 at the start edge and negative in RTL; a pixel of slack absorbs fractional scroll positions */
    static getScrollableEdges({ scrollLeft, scrollWidth, clientWidth, rtl }: TableScrollMetrics): TableScrollableEdges {
        const max = scrollWidth - clientWidth;
        const min = rtl ? -max : 0;
        return { left: scrollLeft - min > 1, right: min + max - scrollLeft > 1 };
    }

    static readScrollMetrics(body: HTMLElement | null | undefined): TableScrollMetrics | null {
        return body ? { scrollLeft: body.scrollLeft, scrollWidth: body.scrollWidth, clientWidth: body.clientWidth, rtl: getComputedStyle(body).direction === 'rtl' } : null;
    }

    /** The attributes sit on the container, the ancestor shared by the header and body scrollers */
    static writeScrollableEdges(body: HTMLElement | null | undefined, { left, right }: TableScrollableEdges) {
        const container = body?.parentElement;
        container?.toggleAttribute('data-scrollable-left', left);
        container?.toggleAttribute('data-scrollable-right', right);
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
            info = typeof formatPageText === 'function' ? formatPageText({ currentStart, currentEnd, total }) : defaultPageText.replace('${currentStart}', String(currentStart)).replace('${currentEnd}', String(currentEnd)).replace('${total}', String(total));
        }

        return info;
    }

    static isSortOrderValid(sortOrder: BaseSortOrder) {
        return (typeof sortOrder === 'string' && strings.SORT_DIRECTIONS.includes(sortOrder)) || sortOrder === false;
    }

    /** The sort and filter state a header cell shows: the column's query by dataIndex, its sort order and filtered values */
    static getColumnQueryState<Q extends { dataIndex?: unknown; sortOrder?: unknown; defaultSortOrder?: unknown; filteredValue?: unknown; defaultFilteredValue?: unknown }>(column: { dataIndex?: unknown }, queries?: Q[]): { query: Q | undefined; sortOrder: BaseSortOrder; filteredValue: Q['filteredValue'] } {
        const query = column.dataIndex != null ? queries?.find((item) => item.dataIndex === column.dataIndex) : undefined;
        const stateSortOrder = query?.sortOrder as BaseSortOrder;
        return {
            query,
            // compat get falls back to the default only for undefined
            sortOrder: TableFoundation.isSortOrderValid(stateSortOrder) ? stateSortOrder : (get(query, 'defaultSortOrder', false) as BaseSortOrder),
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
     * @param flattenColumns the leaf columns of the props
     * @param queries copies of flattenColumns with initColumnsFilteredValueAndSorterOrder applied; the framework copies
     * them, since a deep clone would break framework values held by a column
     */
    static getInitialState<R, C extends BaseColumnProps<R> = BaseColumnProps<R>>(props: TableBaseProps<R>, flattenColumns: C[], queries: C[]): TableColumnsState<R, C> {
        const filteredSortedDataSource = TableFoundation.getFilteredSortedDataSource(props, props.dataSource, queries);
        const pageData = TableFoundation.getPageData(props, filteredSortedDataSource, isObject(props.pagination) ? props.pagination : {}, queries);
        const state: TableColumnsState<R, C> = {
            flattenColumns,
            queries,
            dataSource: pageData.dataSource,
            expandedRowKeys: [...(props.expandedRowKeys || []), ...(props.defaultExpandedRowKeys || [])],
            preExpandedRowKeys: props.expandedRowKeys,
            rowSelection: props.rowSelection ? (isObject(props.rowSelection) ? { ...props.rowSelection } : {}) : null,
            pagination: pageData.pagination,
            groups: null,
            allRowKeys: [],
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
            keyEntities: {},
            filteredSortedDataSource: [],
            filteredSortedRowKeys: [],
            filteredSortedRowKeysSet: new Set(),
        };
        return { ...state, ...TableFoundation.deriveState(props, state, flattenColumns) };
    }

    /** Hosts call it after mount, on body scroll and when the table or its content resizes */
    syncScrollEdges() {
        // probed on first use, which hosts only reach after mount, so SSR never touches CSS
        this.#trackScrollEdges ??= !CSS.supports('container-type', 'scroll-state');
        const metrics = this.#trackScrollEdges ? this._adapter.getScrollMetrics() : null;
        if (metrics) {
            this._adapter.setScrollableEdges(TableFoundation.getScrollableEdges(metrics));
        }
    }

    override init() {
        const dataSource = this.getProp('dataSource');
        const { queries } = this._adapter.getStates();
        const filteredSortedDataSource = this.getFilteredSortedDataSource(dataSource, queries);
        const allDataDisabledRowKeys = this.getAllDisabledRowKeys(filteredSortedDataSource);
        const pageData = this.getCurrentPageData(filteredSortedDataSource);
        this.#setAdapterPageData(pageData);
        // defaultExpandAllRows is only a default, so its groups leave controlled keys alone; the other options still apply
        const { defaultExpandAllRows, expandAllRows, expandAllGroupRows } = this.getProps();
        const applyDefaultKeys = !this.#defaultKeysApplied;
        this.#defaultKeysApplied = true;
        if (applyDefaultKeys && !(defaultExpandAllRows && !expandAllRows && !expandAllGroupRows && pageData.groups?.size && this.#rowExpansionIsControlled())) {
            this.initExpandedRowKeys(pageData);
        }
        let keyEntities: BaseEntitys = {};
        if (this._adapter.getCheckRelation() === 'related' && dataSource && dataSource.length) {
            keyEntities = this.buildKeyEntities(dataSource);
            this._adapter.setKeyEntities(keyEntities);
        }
        if (applyDefaultKeys) {
            this.#initSelectedRowKeys(keyEntities);
        }
        this.#setCachedFilteredSortedDataSource(filteredSortedDataSource);
        this.#setFilteredDisabledRowKeys(allDataDisabledRowKeys);
    }

    /**
     * @param prevProps the props of the previous commit
     * @param prevFlattenColumns the flattenColumns state of the previous commit
     */
    handleUpdate(prevProps: P, prevFlattenColumns: S['flattenColumns']) {
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

        if (props.expandAllRows !== prevProps.expandAllRows || props.expandAllGroupRows !== prevProps.expandAllGroupRows) {
            this.initExpandedRowKeys({ groups: this.getState('groups') });
        }

        const dataSourceChanged = props.dataSource !== prevProps.dataSource;
        const recompute = dataSourceChanged || flattenColumns !== prevFlattenColumns;
        // an unrelated selection keeps no tree
        const becameRelated = this._adapter.getCheckRelation() === 'related' && !(isObject(prevProps.rowSelection) && prevProps.rowSelection.checkRelation === 'related');
        if (becameRelated && !recompute) {
            this.#updateKeyEntities();
        }
        // sorting and filtering recompute in their own handlers and disabled keys in deriveState
        this.#handleDataUpdate(dataSourceChanged, recompute);
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
        this._adapter.setExpandedRowKeys(expandedRowKeys);
    }

    getCurrentPageData(dataSource?: RecordType[], pagination?: BasePagination, queries?: BaseColumnProps<RecordType>[]) {
        const filteredSortedDataSource = this._adapter.getCachedFilteredSortedDataSource();
        dataSource = dataSource == null ? [...filteredSortedDataSource] : dataSource;
        pagination = pagination == null ? this.getState('pagination') && { ...this.getState('pagination') } : pagination;
        queries = queries == null ? [...this.getState('queries')] : queries;
        return TableFoundation.getPageData(this.getProps(), dataSource, pagination, queries);
    }

    /** Scrolls back to the first row; a pagination.onChange that takes over paging still gets the scroll */
    resetScrollY() {
        this._adapter.resetScrollY();
    }

    setPage = (currentPage: number, currentPageSize: number) => {
        currentPage = currentPage || this._adapter.getCurrentPage();
        const currentPagination = this.getState('pagination');
        const { dataSource, pagination, disabledRowKeys, allRowKeys } = this.getCurrentPageData(null, {
            ...currentPagination,
            currentPage,
            pageSize: currentPageSize,
        });
        if (!TableFoundation.#pagerIsControlled(this.getProps()) && currentPage > 0) {
            this._adapter.setPageDisabledRowKeys(disabledRowKeys);
            this._adapter.setAllRowKeys(allRowKeys);
            this._adapter.setPagination(pagination);
            this._adapter.setDataSource(dataSource);
        }

        this.#notifyChange(pagination, undefined, undefined, { changeType: 'pagination' });
    };

    handleSelectRow(realKey: BaseRowKeyType, selected: boolean, e: any) {
        e?.stopPropagation();
        if (typeof selected === 'boolean' && realKey != null) {
            const checkRelation = this._adapter.getCheckRelation();
            const selectedRowKeys = this.#getSelectedRowKeys();
            const halfCheckedRowKeys = [...(this._adapter.getHalfCheckedRowKeys() || [])];
            let foundIdx = -1;
            const selectedRow = this.getRecordsByKeys(null, [realKey])[0];
            let selectedRows: BaseIncludeGroupRecord<RecordType>[];

            if (checkRelation === 'related') {
                const checkedKeysSet = new Set(selectedRowKeys.map((key) => String(key)));
                const halfCheckedKeysSet = new Set(halfCheckedRowKeys.map((key) => String(key)));

                const { checkedKeys, halfCheckedKeys } = this.calcCheckedKeysForSelect(String(realKey), selected, checkedKeysSet, halfCheckedKeysSet);

                const keyEntities = this._adapter.getKeyEntities();
                const newSelectedRowKeys = TableFoundation.#restoreRowKeys(checkedKeys, [...selectedRowKeys, realKey], keyEntities);
                const newHalfCheckedRowKeys = TableFoundation.#restoreRowKeys(halfCheckedKeys, halfCheckedRowKeys, keyEntities);
                selectedRows = this.getRecordsByKeys(null, newSelectedRowKeys);

                // a controlled selection derives its half-checked rows from the keys the parent passes back
                if (!this.#selectionIsControlled()) {
                    this._adapter.setSelectedRowKeys(newSelectedRowKeys);
                    this._adapter.setHalfCheckedRowKeys(newHalfCheckedRowKeys);
                }
                this._adapter.notifySelect(selectedRow, selected, selectedRows, e);
                this._adapter.notifySelectionChange(newSelectedRowKeys, selectedRows);
            } else {
                if ((foundIdx = selectedRowKeys.indexOf(realKey)) > -1 && selected === false) {
                    selectedRowKeys.splice(foundIdx, 1);
                    selectedRows = this.getRecordsByKeys(null, selectedRowKeys);
                    if (!this.#selectionIsControlled()) {
                        this._adapter.setSelectedRowKeys(selectedRowKeys);
                    }
                    this._adapter.notifySelect(selectedRow, selected, selectedRows, e);
                    this._adapter.notifySelectionChange(selectedRowKeys, selectedRows);
                } else if (selectedRowKeys.indexOf(realKey) === -1 && selected === true) {
                    selectedRowKeys.push(realKey);
                    selectedRows = this.getRecordsByKeys(null, selectedRowKeys);
                    if (!this.#selectionIsControlled()) {
                        this._adapter.setSelectedRowKeys(selectedRowKeys);
                    }
                    this._adapter.notifySelect(selectedRow, selected, selectedRows, e);
                    this._adapter.notifySelectionChange(selectedRowKeys, selectedRows);
                }
            }
        }
    }

    handleSelectAllRow(selected: boolean, e: any) {
        e?.stopPropagation();
        if (typeof selected === 'boolean') {
            const checkRelation = this._adapter.getCheckRelation();
            const curSelectedRowKeys = this.#getSelectedRowKeys();
            let selectedRowKeys = [...curSelectedRowKeys];
            const selectedRowKeysSet = this.#getSelectedRowKeysSet();
            // the current filter result without disabled rows, whatever the checkRelation
            const disabledRowKeysSet = this._adapter.getFilteredDisabledRowKeysSet();
            const scopeRowKeys = this._adapter.getCachedFilteredSortedRowKeys().filter((key) => !disabledRowKeysSet.has(key));

            if (checkRelation === 'related') {
                const keyEntities = this._adapter.getKeyEntities();
                const halfCheckedRowKeys = [...(this._adapter.getHalfCheckedRowKeys() || [])];
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

                // a controlled selection derives its half-checked rows from the keys the parent passes back
                if (!this.#selectionIsControlled()) {
                    this._adapter.setSelectedRowKeys(selectedRowKeys);
                    this._adapter.setHalfCheckedRowKeys(newHalfCheckedRowKeys);
                }
                this._adapter.notifySelectAll(selected, selectedRows, changedRows, e);
                this._adapter.notifySelectionChange(selectedRowKeys, selectedRows);
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
                    this._adapter.setSelectedRowKeys(selectedRowKeys);
                }
                this._adapter.notifySelectAll(selected, selectedRows, changedRows, e);
                this._adapter.notifySelectionChange(selectedRowKeys, selectedRows);
            }
        }
    }

    handleRowExpanded(expanded: boolean, realKey: BaseRowKeyType, domEvent: any) {
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
            this._adapter.setExpandedRowKeys(expandedRowKeys);
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

        this._adapter.notifyExpand(expanded, expandedRow, domEvent);
        this._adapter.notifyExpandedRowsChange(expandedRows, [...expandedRowKeys]);
    }

    toggleShowFilter(dataIndex: string, visible: boolean) {
        this._adapter.notifyFilterDropdownVisibleChange(visible, dataIndex);
    }

    handleFilterSelect(dataIndex: string, data: { filteredValue?: string[] } = {}) {
        const query: BaseColumnProps<RecordType> = { ...this.getQuery(dataIndex), filteredValue: data.filteredValue };
        const queries = this.#mergeToQueries(query, null);
        const filters = this.#getAllFilters(queries);
        // onChange reports the pagination and sorter from before this filter
        const pagination = this.#getPagination();
        const sorter = this.#getAllSorters()[0] as BaseChangeInfoSorter<RecordType>;

        if (!this.#filterIsControlled(dataIndex)) {
            this._adapter.setQueries(queries);
            this.#applyQueries(queries);
        }

        this.#notifyChange(pagination, filters, sorter, { changeType: 'filter' });
    }

    // no stopPropagation: it would block an onHeaderCell click handler when the whole title is clickable
    handleSort({ dataIndex }: { dataIndex?: string; sortOrder?: BaseSortOrder } = {}) {
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
            this._adapter.setQueries(queries);
            this.#applyQueries(queries);
        }

        this.#notifyChange(pagination, filters, curQuery, { changeType: 'sorter' });
    }

    /**
     * Select or deselect a row by clicking it when rowSelection.clickRow is set
     */
    handleRowClickSelection(rowKey: BaseRowKeyType, selected: boolean, e: Pick<Event, 'stopPropagation'>) {
        const rowSelection = this.getState('rowSelection');

        if (rowSelection?.clickRow && !rowSelection.disabled) {
            const getCheckboxProps = rowSelection?.getCheckboxProps;
            const record = this._adapter.getCachedFilteredSortedDataSource().find((r: RecordType) => this.getRecordKey(r) === rowKey);

            if (record && typeof getCheckboxProps === 'function' && getCheckboxProps(record).disabled) {
                return;
            }

            this.handleSelectRow(rowKey, selected, e);
        }
    }
}

export type BaseRowKeyType = string | number;
export type BaseRowKey<RecordType> = BaseRowKeyType | ((record: RecordType) => BaseRowKeyType);
export interface BasePagination {
    total?: number;
    currentPage?: number;
    pageSize?: number;
    position?: ArrayElement<typeof strings.PAGINATION_POSITIONS>;
    defaultCurrentPage?: number;
    formatPageText?: any;
}
export interface BaseHeadWidth {
    width: number;
    key: string;
}
export interface BasePageData<RecordType> {
    dataSource?: RecordType[];
    /** Group key (what groupBy returns) -> the row keys in that group */
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
