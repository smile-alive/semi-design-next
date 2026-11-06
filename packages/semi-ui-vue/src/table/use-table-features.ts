import { h, type VNode } from 'vue';
import TableFoundation, { type ColumnFlags as BaseColumnFlags } from '@fibrae/semi-foundation/table/foundation';
import { getExpandColumn, getSelectionColumn } from '@fibrae/semi-foundation/table/utils';
import isObject from '@fibrae/semi-foundation/utils/is-object';
import ColumnFilter from './column-filter.vue';
import ColumnSelection from './column-selection.vue';
import ColumnSorter from './column-sorter.vue';
import CustomExpandIcon from './custom-expand-icon.vue';
import type { ColumnProps, TableProps } from './interface';

type AnyRecord = Record<string, any>;

export type ColumnFlags = BaseColumnFlags<ColumnProps>;

// filterDropdown is true when the column has a #filterDropdown slot
export const columnFlags = (column: ColumnProps, queries?: ColumnProps[]): ColumnFlags => TableFoundation.getColumnFlags(column, queries, column.filterDropdown === true);

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

export const renderSorterNode = (column: ColumnProps, flags: ColumnFlags): VNode => h(ColumnSorter, sorterProps(column, flags));
export const renderFilterNode = (column: ColumnProps, flags: ColumnFlags): VNode => h(ColumnFilter, filterProps(column, flags));
export const renderSelectionNode = (record: AnyRecord | undefined, inHeader: boolean, index?: number): VNode => h(ColumnSelection, { record, inHeader, index });
export const renderExpandIconNode = (record: AnyRecord, isNested: boolean, groupKey?: string | number): VNode => h(CustomExpandIcon, { record, isNested, groupKey });

export function expandColumn(props: Pick<TableProps, 'hideExpandedColumn' | 'expandCellFixed'>, prefixCls: string): ColumnProps | null {
    const fields = getExpandColumn(props.hideExpandedColumn, props.expandCellFixed);
    return fields && { ...fields, class: `${prefixCls}-column-expand` };
}

export function selectionColumn(rowSelection: TableProps['rowSelection'], prefixCls: string): ColumnProps | null {
    const fields = getSelectionColumn(rowSelection);
    return fields && { ...fields, class: [isObject(rowSelection) ? rowSelection.class : undefined, `${prefixCls}-column-selection`] };
}
