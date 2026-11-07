import { numbers } from '@fibrae/semi-foundation/components/table/constants';
import TableFoundation, { type ColumnFlags as BaseColumnFlags } from '@fibrae/semi-foundation/components/table/foundation';
import { assignColumnKeys, getDefaultComponents, getExpandColumn, getSelectionColumn, placeInnerColumns } from '@fibrae/semi-foundation/components/table/utils';
import type { MergedTableComponents } from './context.js';
import type { ColumnProps, TableComponents, TableProps } from './interface.js';

export type ColumnFlags = BaseColumnFlags<ColumnProps>;

// filterDropdown is true when the column has a filterDropdown snippet
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

/** The placeholders are the table's own columns, so the drag class lands next to their class rather than replacing it */
export function addWidthPlaceholders(columns: ColumnProps[], expand: ColumnProps | null, selection: ColumnProps | null) {
    const withWidth = (column: ColumnProps | null, width: number) => column && { ...column, width: column.width ?? width };
    return placeInnerColumns(columns, [withWidth(expand, numbers.DEFAULT_WIDTH_COLUMN_EXPAND), withWidth(selection, numbers.DEFAULT_WIDTH_COLUMN_SELECTION)]);
}

export function buildColumns(columns: ColumnProps[], innerColumns: (ColumnProps | null)[]) {
    return assignColumnKeys(placeInnerColumns(copyColumns(columns), innerColumns)) as ColumnProps[];
}

export const joinStyles = (...styles: (string | false | null | undefined)[]) => styles.filter(Boolean).join(';') || undefined;
