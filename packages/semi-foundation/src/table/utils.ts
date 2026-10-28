// compat get resolves deep path strings such as 'a.b'
import { xor } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { cssClasses, strings, numbers } from './constants';
import type { BaseEllipsis, BaseHeadWidth, BaseRowKeyType } from './foundation';

export function getColumnKey(column: any, keyPropNames: any[]) {
    keyPropNames = Array.isArray(keyPropNames) ? keyPropNames : ['key', 'dataIndex'];
    let key = null;
    for (const propName of keyPropNames) {
        key = get(column, propName);

        if (key != null) {
            break;
        }
    }

    return key;
}

/** Sums arr over [beginIndex, endIndex) */
export function arrayAdd(arr: any[] = [], beginIndex = 0, endIndex?: number) {
    beginIndex = beginIndex < 0 || typeof beginIndex !== 'number' ? 0 : beginIndex;
    endIndex = endIndex > arr.length || typeof endIndex !== 'number' ? arr.length : endIndex;

    let result = 0;
    arr?.forEach((value, index) => {
        if (index >= beginIndex && index < endIndex) {
            result += typeof value === 'number' && !isNaN(value) ? value : 0;
        }
    });

    return result;
}

export function isLastLeftFixed(columns: Record<string, any>[], column: Record<string, any>, checkKeys = ['key']) {
    const leftFixedColumns = columns?.filter((col) => col.fixed === true || col.fixed === 'left') ?? [];
    const index = leftFixedColumns.findIndex((col) => checkKeys.every((key) => col[key] != null && col[key] === column[key]));
    return leftFixedColumns.length > 0 && index === leftFixedColumns.length - 1;
}

export function isFirstFixedRight(columns: Record<string, any>[], column: Record<string, any>, checkKeys = ['key']) {
    const rightFixedColumns = columns?.filter((col) => col.fixed === 'right') ?? [];
    const index = rightFixedColumns.findIndex((col) => checkKeys.every((key) => col[key] != null && col[key] === column[key]));
    return rightFixedColumns.length > 0 && index === 0;
}

export function isFixedLeft(column: Record<string, any>) {
    return ['left', true].includes(column?.fixed);
}

export function isFixedRight(column: Record<string, any>) {
    return ['right'].includes(column?.fixed);
}

/**
 * Where a fixed header cell sticks: the side, swapped in RTL, and the summed widths of the columns before it on that
 * side. Undefined for a column that is not fixed or not measured yet.
 */
export function getHeaderStickyOffset(column: Record<string, any>, slicedColumns: Record<string, any>[], headWidths: number[], isRTL: boolean): { side: 'left' | 'right'; offset: number } | undefined {
    const index = slicedColumns.findIndex((item) => item?.key != null && item.key === column.key);
    if (!headWidths.length || index === -1) {
        return undefined;
    }
    if (isFixedLeft(column)) {
        return { side: isRTL ? 'right' : 'left', offset: arrayAdd(headWidths, 0, index) };
    }
    if (isFixedRight(column)) {
        return { side: isRTL ? 'left' : 'right', offset: arrayAdd(headWidths, index + 1) };
    }
    return undefined;
}

export function isInnerColumnKey(key: string | number) {
    const innerKeys: Array<string | number> = [strings.DEFAULT_KEY_COLUMN_EXPAND, strings.DEFAULT_KEY_COLUMN_SELECTION];
    return innerKeys.includes(key);
}

export function isExpandedColumn(column: Record<string, any>) {
    return column?.key === strings.DEFAULT_KEY_COLUMN_EXPAND;
}

export function isSelectionColumn(column: Record<string, any>) {
    return column?.key === strings.DEFAULT_KEY_COLUMN_SELECTION;
}

export function getRecordKey(record: Record<string, any>, rowKey: string | number | ((record: Record<string, any>) => string | number)) {
    if (rowKey === undefined) {
        rowKey = 'key';
    }
    return typeof rowKey === 'function' ? rowKey(record) : get(record, rowKey);
}

export function isExpanded(expandedRowKeys: (string | number)[], key: string | number) {
    return key != null && (expandedRowKeys?.includes(key) ?? false);
}

export function isSelected(selectedRowKeysSet: Set<string | number>, key: string | number) {
    return key !== null && selectedRowKeysSet.has(key);
}

export function isDisabled(disabledRowKeysSet: Set<string | number>, key: string | number) {
    return key !== null && disabledRowKeysSet.has(key);
}

export function getRecordChildren(record: Record<string, any>, childrenRecordName: string) {
    if (childrenRecordName === undefined) {
        childrenRecordName = 'children';
    }
    return get(record, childrenRecordName);
}

export function genExpandedRowKey(recordKey = '', suffix?: string) {
    if (suffix === undefined) {
        suffix = '__expanded_row';
    }
    return recordKey + suffix;
}

export function getDefaultVirtualizedRowConfig(size = '', sectionRow = false) {
    const config: { height?: number; minHeight?: number } = {};
    if (size === 'small') {
        config.height = sectionRow ? numbers.DEFAULT_VIRTUALIZED_SECTION_ROW_SMALL_HEIGHT : numbers.DEFAULT_VIRTUALIZED_ROW_SMALL_HEIGHT;
        config.minHeight = numbers.DEFAULT_VIRTUALIZED_ROW_SMALL_MIN_HEIGHT;
    } else if (size === 'middle') {
        config.height = sectionRow ? numbers.DEFAULT_VIRTUALIZED_SECTION_ROW_MIDDLE_HEIGHT : numbers.DEFAULT_VIRTUALIZED_ROW_MIDDLE_HEIGHT;
        config.minHeight = numbers.DEFAULT_VIRTUALIZED_ROW_MIDDLE_MIN_HEIGHT;
    } else {
        config.height = sectionRow ? numbers.DEFAULT_VIRTUALIZED_SECTION_ROW_HEIGHT : numbers.DEFAULT_VIRTUALIZED_ROW_HEIGHT;
        config.minHeight = numbers.DEFAULT_VIRTUALIZED_ROW_MIN_HEIGHT;
    }
    return config;
}

export interface VirtualizedRowKind {
    expandedRow: boolean;
    sectionRow: boolean;
}

/** The height of a virtualized row from the itemSize option; the size preset's default stands in when it gives none */
export function resolveVirtualizedItemSize(itemSize: number | ((index: number, row: VirtualizedRowKind) => number) | undefined, size: string | undefined, index: number, row: VirtualizedRowKind) {
    const config = getDefaultVirtualizedRowConfig(size, row.sectionRow);
    const value = typeof itemSize === 'function' ? itemSize(index, row) : itemSize;
    return { size: value ?? config.height, minHeight: config.minHeight };
}

export function flattenColumns(cols: Record<string, any>[], childrenColumnName = 'children'): Record<string, any>[] {
    const list = [];
    if (Array.isArray(cols) && cols.length) {
        for (const col of cols) {
            if (Array.isArray(col[childrenColumnName]) && col[childrenColumnName].length) {
                list.push(...flattenColumns(col[childrenColumnName], childrenColumnName));
            } else {
                list.push(col);
            }
        }
    }

    return list;
}

export function assignColumnKeys(columns: Record<string, any>[], childrenColumnName = 'children', level = 0) {
    const sameLevelCols: Record<string, any>[] = [];
    columns?.forEach((column, index) => {
        if (column.key == null) {
            const _index = column.dataIndex || index;
            column.key = `${level}-${_index}`;
        }
        if (Array.isArray(column[childrenColumnName]) && column[childrenColumnName].length) {
            sameLevelCols.push(...column[childrenColumnName]);
        }
    });
    if (sameLevelCols.length) {
        assignColumnKeys(sameLevelCols, childrenColumnName, level + 1);
    }
    return columns;
}

/**
 * Adds the expand and selection columns: a user column with the same key overrides their fields, otherwise a
 * right-fixed one goes last and any other first. Replaces entries of `columns`, so the caller passes its own copy.
 */
export function placeInnerColumns<T extends { key?: unknown; fixed?: unknown }>(columns: T[], innerColumns: (T | null)[]) {
    let placed = columns;
    for (const column of innerColumns) {
        if (column) {
            const destIndex = placed.findIndex((item) => item.key === column.key);
            if (destIndex > -1) {
                placed[destIndex] = { ...column, ...placed[destIndex] };
            } else if (column.fixed === 'right') {
                placed = [...placed, column];
            } else {
                placed = [column, ...placed];
            }
        }
    }
    return placed;
}

/** The measured widths of the columns in order; a column not measured yet is skipped */
export function getCellWidths(headWidths: BaseHeadWidth[][] | undefined, columns: { key?: unknown }[] | undefined) {
    if (!columns?.length || !headWidths?.length) {
        return [];
    }
    const widths = headWidths.flat();
    return columns.flatMap((column) => {
        const found = widths.find((item) => item?.key != null && item.key === column.key);
        return found ? [found.width] : [];
    });
}

export function sliceColumnsByLevel(columns: any[], targetLevel = 0, childrenColumnName = 'children', currentLevel = 0) {
    const slicedColumns: any[] = [];
    if (Array.isArray(columns) && columns.length && currentLevel <= targetLevel) {
        columns.forEach((column) => {
            const children = column[childrenColumnName];
            if (Array.isArray(children) && children.length && currentLevel < targetLevel) {
                slicedColumns.push(...sliceColumnsByLevel(children, targetLevel, childrenColumnName, currentLevel + 1));
            } else {
                slicedColumns.push(column);
            }
        });
    }
    return slicedColumns;
}

export function getColumnsByLevel(columns: Record<string, any>[], targetLevel = 0, targetColumns: Record<string, any>[] = [], currentLevel = 0, childrenColumnName = 'children') {
    if (Array.isArray(columns) && columns.length) {
        if (targetLevel === currentLevel) {
            targetColumns.push(...columns);
        } else {
            columns.forEach((column) => {
                getColumnsByLevel(column[childrenColumnName], targetLevel, targetColumns, currentLevel + 1, childrenColumnName);
            });
        }
    }
    return targetColumns;
}

export function findColumn(columns: Record<string, any>[], column: Record<string, any>, childrenColumnName = 'children') {
    let found: any;
    for (const item of columns ?? []) {
        if (item && item.key != null && !found) {
            if (item.key === column.key) {
                found = item;
            }
        }
        if (item && Array.isArray(item[childrenColumnName]) && !found) {
            found = findColumn(item[childrenColumnName], column, childrenColumnName);
        }

        if (found) {
            break;
        }
    }

    return found;
}

export function expandBtnShouldInRow({ expandedRowRender, dataSource, hideExpandedColumn, childrenRecordName, rowExpandable }: ExpandBtnShouldInRowProps) {
    const hasExpandedRowRender = typeof expandedRowRender === 'function';
    return (
        (hideExpandedColumn && hasExpandedRowRender) ||
        (!hasExpandedRowRender &&
            dataSource.some((record) => {
                const children = get(record, childrenRecordName);
                if ((Array.isArray(children) && children.length) || rowExpandable(record)) {
                    return true;
                } else {
                    return false;
                }
            }))
    );
}

/**
 * Whether a record row can expand: an expanded row or tree children make it expandable unless rowExpandable says no;
 * without them only rowExpandable does
 */
export function mergedRowExpandable<R extends Record<string, any>>(record: R, { childrenRecordName, hasExpandedRow, rowExpandable }: { childrenRecordName: string; hasExpandedRow: boolean; rowExpandable?: (record: R) => unknown }) {
    const children = get(record, childrenRecordName);
    const hasChildren = Array.isArray(children) && children.length > 0;
    const strict = typeof rowExpandable === 'function' && Boolean(rowExpandable(record));
    const loose = typeof rowExpandable !== 'function' || strict;
    return ((hasExpandedRow || hasChildren) && loose) || (!(hasExpandedRow || hasChildren) && strict);
}

export type ExpandBtnShouldInRowProps = {
    expandedRowRender: (record?: Record<string, any>, index?: number, expanded?: boolean) => any;
    dataSource: Record<string, any>[];
    hideExpandedColumn: boolean;
    childrenRecordName: string;
    rowExpandable: (record?: Record<string, any>) => boolean;
};

/** Whether the column sorts or filters without a dataIndex to keep its state */
export function isMissingDataIndex({ filters, sorter, dataIndex, onFilter }: Record<string, any>) {
    return (Array.isArray(filters) || typeof onFilter === 'function' || typeof sorter === 'function') && dataIndex == null;
}

export function getRTLAlign(align: (typeof strings.ALIGNS)[number], direction?: 'ltr' | 'rtl'): (typeof strings.ALIGNS)[number] {
    if (direction === 'rtl') {
        switch (align) {
            case 'left':
                return 'right';
            case 'right':
                return 'left';
            default:
                return align;
        }
    }
    return align;
}

export function getRTLFlexAlign(align: (typeof strings.ALIGNS)[number], direction?: 'ltr' | 'rtl'): (typeof strings.JUSTIFY_CONTENT)[number] {
    if (direction === 'rtl') {
        switch (align) {
            case 'left':
                return 'flex-end';
            case 'right':
                return 'flex-start';
            default:
                return align;
        }
    } else {
        switch (align) {
            case 'left':
                return 'flex-start';
            case 'right':
                return 'flex-end';
            default:
                return align;
        }
    }
}

export function shouldShowEllipsisTitle(ellipsis: BaseEllipsis) {
    const shouldShowTitle = typeof ellipsis !== 'object' || (ellipsis?.showTitle ?? true);
    return shouldShowTitle;
}

/** Merges new columns over old ones with the same key or dataIndex, so state kept on a column survives */
export function mergeColumns<C extends Record<string, any>>(oldColumns: C[] = [], newColumns: C[] = []) {
    return newColumns.map((newColumn) => {
        const key = getColumnKey(newColumn, null);
        const oldColumn = key != null ? oldColumns.find((item) => getColumnKey(item, null) === key) : undefined;
        const column: C = { ...newColumn };
        // only the sort order and filtered values picked inside an uncontrolled table carry over; any other key
        // dropped from the column stops applying
        if (oldColumn && newColumn.sorter && newColumn.sortOrder == null) {
            (column as Record<string, any>).sortOrder = oldColumn.sortOrder;
        }
        const filterable = Array.isArray(newColumn.filters) || typeof newColumn.onFilter === 'function' || typeof newColumn.renderFilterDropdown === 'function' || newColumn.filterDropdown != null;
        if (oldColumn && filterable && !Array.isArray(newColumn.filteredValue)) {
            (column as Record<string, any>).filteredValue = oldColumn.filteredValue;
        }
        return column;
    });
}

/** The number of header rows: the depth of the column tree */
export function getHeaderRowCount(columns: Record<string, any>[]): number {
    return Math.max(0, ...columns.map((column) => (column.children?.length ? 1 + getHeaderRowCount(column.children) : 1)));
}

/** The next sort order, named as the locale texts of the sort tooltip */
export function getNextSortOrder(sortOrder: string | boolean) {
    switch (sortOrder) {
        case strings.SORT_DIRECTIONS[0]:
            return strings.SORT_DIRECTIONS[1];
        case strings.SORT_DIRECTIONS[1]:
            return 'cancelSort';
        default:
            return strings.SORT_DIRECTIONS[0];
    }
}

/** The filtered values after a click on the filter option `value`: a checked option is unchecked */
export function toggleFilteredValue<V>(filteredValue: V[], value: V, filterMultiple: boolean) {
    const values = [...filteredValue];
    const index = values.indexOf(value);
    if (index > -1) {
        values.splice(index, 1);
        return values;
    }
    return filterMultiple ? [...values, value] : [value];
}

export interface TableHeaderCell<Column extends Record<string, any> = Record<string, any>> {
    key: string | number;
    className: string;
    /** The column title, or what a title function returns */
    children: any;
    column: Column;
    colStart: number;
    level: number;
    parents: TableHeaderCell<Column>[];
    hasSubColumns?: boolean;
    rowSpan?: number;
    colSpan?: number;
    colEnd?: number;
    /** Reaches the table's end edge */
    last?: boolean;
    title?: string;
}

/**
 * The header cells by row, with the colSpan and rowSpan that merge the cells of grouped columns
 */
export function parseHeaderRows<Column extends Record<string, any>>(columns: Column[]) {
    const rows: TableHeaderCell<Column>[][] = [];

    const fillRowCells = (columns: Column[], colIndex: number, parents: TableHeaderCell<Column>[] = [], rowIndex = 0, level = 0) => {
        rows[rowIndex] ??= [];

        let currentColIndex = colIndex;
        const colSpans = columns.map((column) => {
            const cell: TableHeaderCell<Column> = {
                key: column.key,
                className: column.className || '',
                // the documented title argument is an object even without title parts
                children: typeof column.title === 'function' ? column.title({}) : column.title,
                column,
                colStart: currentColIndex,
                level,
                parents,
            };

            let colSpan = 1;

            /**
             * colSpan: the sum of the children's colSpan, or 1 without children
             */
            const subColumns = column.children;
            if (subColumns && subColumns.length > 0) {
                colSpan = fillRowCells(subColumns, currentColIndex, [...parents, cell], rowIndex + 1, level + 1).reduce((total, count) => total + count, 0);
                cell.hasSubColumns = true;
            }

            if ('colSpan' in column) {
                ({ colSpan } = column);
            }

            cell.colSpan = colSpan;
            cell.colEnd = cell.colStart + colSpan - 1;
            rows[rowIndex].push(cell);

            currentColIndex += colSpan;

            if (shouldShowEllipsisTitle(column.ellipsis) && typeof cell.children === 'string') {
                cell.title = cell.children;
            }

            return colSpan;
        });

        return colSpans;
    };

    const columnCount = fillRowCells(columns, 0).reduce((total, count) => total + count, 0);

    /**
     * rowSpan: a cell without children spans the remaining rows; a cell with children needs none
     */
    const rowCount = rows.length;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        rows[rowIndex].forEach((cell) => {
            if (!cell.hasSubColumns) {
                cell.rowSpan = rowCount - rowIndex;
            }
            cell.last = cell.colEnd >= columnCount - 1;
        });
    }

    return rows;
}

/** The keys whose selection state differs between two selections */
export function getChangedRowKeys(before: Array<string | number>, after: Array<string | number>) {
    return xor(before, after);
}

export interface FlattenDataProps {
    rowKey?: string | number | ((record: any) => string | number);
    childrenRecordName?: string;
    expandedRowRender?: (...args: any[]) => any;
    expandedRowKeys?: (string | number)[];
    groups?: Map<any, Set<any>>;
    /** Whether a record gets an expanded row; every record does when absent */
    rowExpandable?: (record: any) => boolean;
}

/**
 * The rows a virtualized body renders, in the order of the non-virtualized body: group sections, then each record,
 * its expanded row and its tree children. Records of a group sit at the level of the section.
 */
export function flattenData(props: FlattenDataProps, dataSource: any[] = []) {
    const expandedKeys = new Set(props.expandedRowKeys);
    const { rowKey, groups } = props;
    if (!(groups instanceof Map)) {
        return flattenRecords(props, expandedKeys, dataSource, 0);
    }
    const flattened: Array<FlattenData | GroupFlattenData> = [];
    groups.forEach((set, key) => {
        const firstIndex = dataSource.findIndex((record) => set.has(getRecordKey(record, rowKey)));
        if (firstIndex > -1) {
            const lastIndex = dataSource.findLastIndex((record) => set.has(getRecordKey(record, rowKey)));
            const expanded = expandedKeys.has(key);
            flattened.push({ key, level: 0, sectionRow: true, group: set, groupKey: key, expanded });
            if (expanded) {
                flattened.push(...flattenRecords(props, expandedKeys, dataSource.slice(firstIndex, lastIndex + 1), 0));
            }
        }
    });
    return flattened;
}

function flattenRecords(props: FlattenDataProps, expandedKeys: Set<string | number>, dataSource: any[], level: number) {
    const { rowKey, childrenRecordName, expandedRowRender, rowExpandable } = props;
    return dataSource.flatMap((record) => {
        const recordKey = getRecordKey(record, rowKey);
        const rows: FlattenData[] = [{ key: recordKey, record, level }];
        if (expandedKeys.has(recordKey)) {
            if (expandedRowRender && (rowExpandable?.(record) ?? true)) {
                rows.push({ key: genExpandedRowKey(recordKey), level, expandedRow: true, expanded: true, record });
            }
            const children = getRecordChildren(record, childrenRecordName);
            if (Array.isArray(children) && children.length) {
                rows.push(...flattenRecords(props, expandedKeys, children, level + 1));
            }
        }
        return rows;
    });
}

export interface GroupFlattenData {
    key: number | string;
    level: number;
    sectionRow: boolean;
    group: Set<any>;
    groupKey: number | string;
    expanded: boolean;
}

export interface FlattenData {
    key: number | string;
    record: Record<string, any>;
    level: number;
    expandedRow?: boolean;
    /** Set on an expanded row: the third argument of expandedRowRender */
    expanded?: boolean;
    sectionRow?: boolean;
}

/** The first record of each row key; an empty or missing key cannot be looked up */
export function buildRecordsByKey(dataSource: Record<string, any>[] | undefined, rowKey: FlattenDataProps['rowKey']) {
    const recordsByKey = new Map<BaseRowKeyType, Record<string, any>>();
    dataSource?.forEach((record) => {
        const key = getRecordKey(record, rowKey);
        if (key != null && key !== '' && !recordsByKey.has(key)) {
            recordsByKey.set(key, record);
        }
    });
    return recordsByKey;
}

export interface BodyRowsOptions {
    rowKey?: FlattenDataProps['rowKey'];
    childrenRecordName?: string;
    expandedRowKeys?: BaseRowKeyType[];
    /** Whether the table renders expanded rows (expandedRowRender or its slot) */
    hasExpandedRow: boolean;
    keepDOM?: boolean;
    rowExpandable?: (record: Record<string, any>) => boolean;
}

/** A row of a non-virtualized body; `key` is the record key (or its index) and, for a section row, the group key */
export type BodyRow =
    | { kind: 'base'; key: BaseRowKeyType; record: Record<string, any>; index: number; level: number; displayNone: boolean }
    | { kind: 'expanded'; key: BaseRowKeyType; record: Record<string, any>; index: number; expanded: boolean; displayNone: boolean }
    | { kind: 'section'; key: BaseRowKeyType; group: Set<BaseRowKeyType>; index: number; expanded: boolean };

/**
 * The rows of a non-virtualized body in render order: each record, its expanded row and its shown tree children,
 * under the section row of their group, groups in the order their first record appears. Unlike flattenData it keeps
 * an expanded row beside tree children and, under keepDOM, the collapsed rows, hidden. `recordsByKey` is the
 * buildRecordsByKey map of the page, read for groups.
 */
export function flattenBodyRows(options: BodyRowsOptions, dataSource: Record<string, any>[] | undefined, groups: Map<BaseRowKeyType, Set<BaseRowKeyType>> | null | undefined, recordsByKey: Map<BaseRowKeyType, Record<string, any>>) {
    const rows: BodyRow[] = [];
    if (!(groups instanceof Map)) {
        pushBodyRows(options, dataSource ?? [], 0, false, rows);
        return rows;
    }
    const groupsInData = new Map<BaseRowKeyType, Set<BaseRowKeyType>>();
    dataSource?.forEach((record) => {
        const key = getRecordKey(record, options.rowKey);
        groups.forEach((group, groupKey) => {
            if (group.has(key)) {
                if (!groupsInData.has(groupKey)) {
                    groupsInData.set(groupKey, new Set());
                }
                groupsInData.get(groupKey).add(key);
            }
        });
    });
    [...groupsInData].forEach(([groupKey, group], index) => {
        const expanded = isExpanded(options.expandedRowKeys, groupKey);
        rows.push({ kind: 'section', key: groupKey, group, index, expanded });
        if (expanded || options.keepDOM) {
            pushBodyRows(
                options,
                [...group].flatMap((key) => recordsByKey.get(key) ?? []),
                0,
                !expanded,
                rows
            );
        }
    });
    return rows;
}

function pushBodyRows(options: BodyRowsOptions, data: Record<string, any>[], level: number, displayNone: boolean, rows: BodyRow[]) {
    data.forEach((record, index) => {
        const key = getRecordKey(record, options.rowKey) ?? index;
        rows.push({ kind: 'base', key, record, index, level, displayNone });
        const expanded = isExpanded(options.expandedRowKeys, key);
        const shown = expanded || Boolean(options.keepDOM);
        if (options.hasExpandedRow && options.rowExpandable?.(record) && shown) {
            rows.push({ kind: 'expanded', key, record, index, expanded, displayNone: displayNone || !expanded });
        }
        const children = getRecordChildren(record, options.childrenRecordName);
        if (Array.isArray(children) && children.length && shown) {
            pushBodyRows(options, children, level + 1, displayNone || !expanded, rows);
        }
    });
}

/**
 * The keys of the rows that the rowSpan cells covering the hovered row span, read from the DOM: which cells span which
 * rows is only known after onCell ran for every cell, so it is called from hover events, never during render
 */
export function getRowSpanHoverKeys(root: Element | null | undefined, currentRowKey: string) {
    const keys = new Set([currentRowKey]);
    const rows = Array.from(root?.querySelectorAll('tr[data-row-key]') ?? []);
    const current = rows.findIndex((row) => row.getAttribute('data-row-key') === currentRowKey);
    if (current === -1) {
        return keys;
    }
    rows.forEach((row, rowIndex) => {
        row.querySelectorAll('td[rowspan]').forEach((cell) => {
            const spanEnd = rowIndex + Number.parseInt(cell.getAttribute('rowspan') || '1', 10) - 1;
            if (spanEnd > rowIndex && current >= rowIndex && current <= spanEnd) {
                for (let i = rowIndex; i <= spanEnd && i < rows.length; i++) {
                    const key = rows[i].getAttribute('data-row-key');
                    if (key) {
                        keys.add(key);
                    }
                }
            }
        });
    });
    return keys;
}

let scrollbarVerticalSize: number, scrollbarHorizontalSize: number;

const scrollbarMeasure = {
    position: 'absolute',
    top: '-9999px',
    width: '50px',
    height: '50px',
};

export function measureScrollbar(direction = 'vertical') {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return 0;
    }
    const isVertical = direction === 'vertical';
    // a width of 0 (overlay scrollbars) is a result too
    if (isVertical && scrollbarVerticalSize !== undefined) {
        return scrollbarVerticalSize;
    } else if (!isVertical && scrollbarHorizontalSize !== undefined) {
        return scrollbarHorizontalSize;
    }
    const scrollDiv = document.createElement('div');
    // gives it the same thin scrollbar as the table body
    scrollDiv.className = `${cssClasses.PREFIX}-scrollbar-measure`;
    Object.keys(scrollbarMeasure).forEach((scrollProp) => {
        scrollDiv.style[scrollProp] = scrollbarMeasure[scrollProp];
    });
    if (isVertical) {
        scrollDiv.style.overflowY = 'scroll';
    } else {
        scrollDiv.style.overflowX = 'scroll';
    }
    document.body.appendChild(scrollDiv);
    let size = 0;
    if (isVertical) {
        size = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        scrollbarVerticalSize = size;
    } else {
        size = scrollDiv.offsetHeight - scrollDiv.clientHeight;
        scrollbarHorizontalSize = size;
    }

    document.body.removeChild(scrollDiv);

    return size;
}

export function amendTableWidth(tableWidth: number) {
    return typeof tableWidth === 'number' ? tableWidth - numbers.DEFAULT_CELL_PADDING_LEFT - numbers.DEFAULT_CELL_PADDING_RIGHT - numbers.DEFAULT_CELL_BORDER_WIDTH_LEFT - numbers.DEFAULT_CELL_BORDER_WIDTH_RIGHT - measureScrollbar('vertical') : undefined;
}
