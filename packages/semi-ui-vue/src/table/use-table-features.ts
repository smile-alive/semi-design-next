import { h, type VNode } from 'vue';
import { strings } from '@fibrae/semi-foundation/table/constants';
import TableFoundation from '@fibrae/semi-foundation/table/foundation';
import isObject from '@fibrae/semi-foundation/utils/is-object';
import ColumnFilter from './column-filter.vue';
import ColumnSelection from './column-selection.vue';
import ColumnSorter from './column-sorter.vue';
import CustomExpandIcon from './custom-expand-icon.vue';
import type { ColumnProps, RowSelectionProps, SortOrder, TablePaginationProps, TableProps } from './interface';

type AnyRecord = Record<string, any>;

export interface ColumnFlags {
    hasSorter: boolean;
    hasFilter: boolean;
    /** The header cell renders ColumnTitle instead of the plain title */
    needsTitle: boolean;
    /** A click on the header cell sorts */
    clickToSort: boolean;
    showSortTip: boolean;
    sortOrder: SortOrder;
    filteredValue: unknown[] | undefined;
    /** The sort and filter state of the column, when it has a dataIndex */
    query: ColumnProps | undefined;
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
export function columnFlags(column: ColumnProps, queries?: ColumnProps[]): ColumnFlags {
    // filterDropdown counts, unlike React where a lone element renders nothing: here the flag only opens a panel
    if (!(column.sorter || column.filters || column.onFilter || column.useFullRender || column.filterDropdown)) {
        return PLAIN_FLAGS;
    }
    const hasSorter = typeof column.sorter === 'function' || column.sorter === true;
    const hasFilter = (Array.isArray(column.filters) && column.filters.length > 0) || column.filterDropdown === true;
    return {
        hasSorter,
        hasFilter,
        needsTitle: true,
        clickToSort: hasSorter && !hasFilter && !column.useFullRender,
        showSortTip: column.sortOrder == null && column.showSortTip === true,
        ...TableFoundation.getColumnQueryState(column, queries),
    };
}

export const sorterProps = (column: ColumnProps, flags: ColumnFlags) => ({
    column,
    sortOrder: flags.sortOrder,
    showTooltip: !flags.clickToSort && flags.showSortTip,
    sortsOnClick: Boolean(column.useFullRender) || flags.hasFilter,
});

export const filterProps = (column: ColumnProps, flags: ColumnFlags) => ({
    column,
    query: flags.query ?? column,
    filteredValue: flags.filteredValue,
});

/** The sort button of a full render title */
export const renderSorterNode = (column: ColumnProps, flags: ColumnFlags): VNode => h(ColumnSorter, sorterProps(column, flags));
export const renderFilterNode = (column: ColumnProps, flags: ColumnFlags): VNode => h(ColumnFilter, filterProps(column, flags));
export const renderSelectionNode = (record: AnyRecord | undefined, inHeader: boolean, index?: number): VNode => h(ColumnSelection, { record, inHeader, index });
export const renderExpandIconNode = (record: AnyRecord, isNested: boolean, groupKey?: string | number): VNode => h(CustomExpandIcon, { record, isNested, groupKey });

/**
 * The user's onChange replaces the table's own paging, which resets the scroll itself; with scrollToFirstRowOnChange
 * the replacement still resets it. Merged here because Vue's listener merge would call both.
 */
export function mergePagination(pagination: TablePaginationProps | null | undefined, scrollToFirstRowOnChange: boolean, setPage: (currentPage: number, pageSize: number) => void, resetScrollY: () => void): TablePaginationProps | null {
    if (!pagination) {
        return null;
    }
    const userOnChange = pagination.onChange;
    if (scrollToFirstRowOnChange && userOnChange) {
        return {
            ...pagination,
            onChange: (currentPage: number, pageSize: number) => {
                resetScrollY();
                userOnChange(currentPage, pageSize);
            },
        };
    }
    return { onChange: setPage, ...pagination };
}

/** The column of expand buttons, shown when hideExpandedColumn is false */
export function expandColumn(props: Pick<TableProps, 'hideExpandedColumn' | 'expandCellFixed'>, prefixCls: string) {
    return props.hideExpandedColumn
        ? null
        : ({
              fixed: props.expandCellFixed,
              key: strings.DEFAULT_KEY_COLUMN_EXPAND,
              class: `${prefixCls}-column-expand`,
          } satisfies ColumnProps);
}

/** The column of selection checkboxes */
export function selectionColumn(rowSelection: TableProps['rowSelection'], prefixCls: string) {
    if (!rowSelection || (isObject(rowSelection) && rowSelection.hidden)) {
        return null;
    }
    const options: RowSelectionProps = isObject(rowSelection) ? rowSelection : {};
    return {
        key: strings.DEFAULT_KEY_COLUMN_SELECTION,
        fixed: options.fixed,
        width: options.width,
        onCell: options.onCell,
        onHeaderCell: options.onHeaderCell,
        class: [options.class, `${prefixCls}-column-selection`],
    } satisfies ColumnProps;
}
