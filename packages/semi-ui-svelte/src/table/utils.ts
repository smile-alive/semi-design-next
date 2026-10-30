import { numbers, strings } from '@fibrae/semi-foundation/table/constants';
import TableFoundation from '@fibrae/semi-foundation/table/foundation';
import { assignColumnKeys, placeInnerColumns } from '@fibrae/semi-foundation/table/utils';
import type { MergedTableComponents } from './context.js';
import type { ColumnProps, RowSelectionProps, SortOrder, TableComponents, TablePaginationProps, TableProps } from './interface.js';

export interface ColumnFlags {
    hasSorter: boolean;
    hasFilter: boolean;
    /** The header cell composes the title with the sort and filter buttons instead of the plain title */
    needsTitle: boolean;
    /** A click on the header cell sorts */
    clickToSort: boolean;
    showSortTip: boolean;
    sortOrder: SortOrder;
    filteredValue?: unknown[];
    /** The sort and filter state of the column, when it has a dataIndex */
    query?: ColumnProps;
}

const PLAIN_FLAGS: ColumnFlags = {
    hasSorter: false,
    hasFilter: false,
    needsTitle: false,
    clickToSort: false,
    showSortTip: false,
    sortOrder: false,
    filteredValue: undefined,
    query: undefined,
};

/** How the header cell of a column sorts and filters, decided as React Table does */
export function columnFlags(column: ColumnProps, queries?: ColumnProps[]) {
    // filterDropdown counts, unlike React where a lone element renders nothing: here the flag only opens a panel
    if (!(column.sorter || column.filters || column.onFilter || column.useFullRender || column.filterDropdown)) {
        return PLAIN_FLAGS;
    }
    const hasSorter = typeof column.sorter === 'function' || column.sorter === true;
    const hasFilter = (Array.isArray(column.filters) && column.filters.length > 0) || column.filterDropdown === true;
    const query = TableFoundation.getColumnQueryState(column, queries);
    return {
        hasSorter,
        hasFilter,
        needsTitle: true,
        clickToSort: hasSorter && !hasFilter && !column.useFullRender,
        showSortTip: column.sortOrder == null && column.showSortTip === true,
        sortOrder: query.sortOrder as SortOrder,
        filteredValue: query.filteredValue as unknown[] | undefined,
        query: query.query as ColumnProps | undefined,
    };
}

// Not a deep merge: only the tags are replaced
export function mergeComponents(components: TableComponents | undefined, virtualized: boolean): MergedTableComponents {
    const defaults = virtualized ? { outer: 'div', wrapper: 'div', row: 'div', cell: 'div', colgroup: { wrapper: 'div', col: 'div' } } : { outer: 'table', wrapper: 'tbody', row: 'tr', cell: 'td', colgroup: { wrapper: 'colgroup', col: 'col' } };
    return {
        header: { outer: 'table', wrapper: 'thead', row: 'tr', cell: 'th', ...components?.header },
        body: { ...defaults, ...components?.body, colgroup: { ...defaults.colgroup, ...components?.body?.colgroup } },
    };
}

/** The column of expand buttons, shown when hideExpandedColumn is false */
export function expandColumn(hideExpandedColumn: boolean, expandCellFixed: TableProps['expandCellFixed'], prefixCls: string): ColumnProps | null {
    return hideExpandedColumn ? null : { fixed: expandCellFixed, key: strings.DEFAULT_KEY_COLUMN_EXPAND, class: `${prefixCls}-column-expand` };
}

/** The column of selection checkboxes */
export function selectionColumn(rowSelection: TableProps['rowSelection'], prefixCls: string): ColumnProps | null {
    if (!rowSelection || (typeof rowSelection === 'object' && rowSelection.hidden)) {
        return null;
    }
    const options: RowSelectionProps = typeof rowSelection === 'object' ? rowSelection : {};
    return {
        key: strings.DEFAULT_KEY_COLUMN_SELECTION,
        fixed: options.fixed,
        width: options.width,
        onCell: options.onCell,
        onHeaderCell: options.onHeaderCell,
        class: [options.class, `${prefixCls}-column-selection`].filter(Boolean).join(' '),
    };
}

/** Copies the column tree, so that keys and overrides can be written without touching the prop */
export const copyColumns = (list: ColumnProps[]): ColumnProps[] => list.map((column) => (Array.isArray(column.children) && column.children.length ? { ...column, children: copyColumns(column.children) } : { ...column }));

/**
 * Places the expand and selection columns with a default width, so that a resizable table can resize them too. The
 * placeholders are the table's own columns, so the drag class lands next to their class rather than replacing it.
 */
export function addWidthPlaceholders(columns: ColumnProps[], expand: ColumnProps | null, selection: ColumnProps | null) {
    const withWidth = (column: ColumnProps | null, width: number) => column && { ...column, width: column.width ?? width };
    return placeInnerColumns(columns, [withWidth(expand, numbers.DEFAULT_WIDTH_COLUMN_EXPAND), withWidth(selection, numbers.DEFAULT_WIDTH_COLUMN_SELECTION)]);
}

/** Copies the columns, so the keys and merged inner columns stay off the user's objects, and adds the inner columns */
export function buildColumns(columns: ColumnProps[], innerColumns: (ColumnProps | null)[]) {
    return assignColumnKeys(placeInnerColumns(copyColumns(columns), innerColumns)) as ColumnProps[];
}

/**
 * The user's onChange replaces the table's own paging, which resets the scroll itself; with scrollToFirstRowOnChange
 * the replacement still resets it
 */
export function mergePagination(pagination: TablePaginationProps | undefined, scrollToFirstRowOnChange: boolean, setPage: (currentPage: number, pageSize: number) => void, resetScrollY: () => void, onPage: (currentPage: number) => void): TablePaginationProps | null {
    if (!pagination) {
        return null;
    }
    const userOnChange = pagination.onChange;
    const change = userOnChange ?? setPage;
    return {
        ...pagination,
        onChange: (currentPage: number, pageSize: number) => {
            if (scrollToFirstRowOnChange && userOnChange) {
                resetScrollY();
            }
            change(currentPage, pageSize);
            onPage(currentPage);
        },
    };
}

/** Joins style declarations, skipping empty ones */
export const joinStyles = (...styles: (string | false | null | undefined)[]) => styles.filter(Boolean).join(';') || undefined;
