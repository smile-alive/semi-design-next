import TableFoundation, { type ColumnFlags as BaseColumnFlags } from '@fibrae/semi-foundation/components/table/foundation';
import { assignColumnKeys, getDefaultComponents, getExpandColumn, getSelectionColumn, placeInnerColumns } from '@fibrae/semi-foundation/components/table/utils';
import type { MergedTableComponents } from './context.js';
import type { ColumnProps, TableComponents, TableProps } from './interface.js';

export type ColumnFlags = BaseColumnFlags<ColumnProps>;

export const columnFlags = (column: ColumnProps, queries?: ColumnProps[]): ColumnFlags => TableFoundation.getColumnFlags(column, queries, column.filterDropdown === true);

export function mergeComponents(components: TableComponents | undefined, virtualized: boolean): MergedTableComponents {
    const defaults = getDefaultComponents(virtualized);
    return {
        header: { ...defaults.header, ...components?.header },
        body: { ...defaults.body, ...components?.body, colgroup: { ...defaults.body.colgroup, ...components?.body?.colgroup } },
    };
}

export function expandColumn(hideExpandedColumn: boolean, expandCellFixed: TableProps['expandCellFixed'], prefixCls: string): ColumnProps | null {
    const fields = getExpandColumn(hideExpandedColumn, expandCellFixed);
    return fields && { ...fields, class: `${prefixCls}-column-expand` };
}

export function selectionColumn(rowSelection: TableProps['rowSelection'], prefixCls: string): ColumnProps | null {
    const fields = getSelectionColumn(rowSelection);
    return fields && { ...fields, class: [typeof rowSelection === 'object' ? rowSelection.class : undefined, `${prefixCls}-column-selection`].filter(Boolean).join(' ') };
}

export const copyColumns = (list: ColumnProps[]): ColumnProps[] => list.map((column) => (Array.isArray(column.children) && column.children.length ? { ...column, children: copyColumns(column.children) } : { ...column }));

export function buildColumns(columns: ColumnProps[], innerColumns: (ColumnProps | null)[]) {
    return assignColumnKeys(placeInnerColumns(copyColumns(columns), innerColumns)) as ColumnProps[];
}

export const joinStyles = (...styles: (string | false | null | undefined)[]) => styles.filter(Boolean).join(';') || undefined;
