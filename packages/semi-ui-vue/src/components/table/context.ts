import type { ComputedRef, CSSProperties } from 'vue';
import type TableFoundation from '@fibrae/semi-foundation/components/table/foundation';
import type { BaseHeadWidth, BaseRowKeyType, TableBaseProps, TableBaseState, TableBaseStateRowSelection } from '@fibrae/semi-foundation/components/table/foundation';
import { createContext } from '../../base/index';
import type { RawSlots, KeyedNode } from '../../utils/index';
import type { ColumnProps, TableComponent, TableHeaderCellSlotProps, TableProps, TableRowKey, TableScroll, TableSize, TableSlots, TableSticky, TableVirtualizedProps } from './interface';

type AnyRecord = Record<string, any>;

/**
 * The foundation's state. Its flattenColumns and queries hold the Vue column objects, typed as the foundation's
 * column type: a Vue onCell returns Vue attributes, which the foundation's column type does not describe
 */
export type TableState = TableBaseState<AnyRecord>;
export type TableFoundationProps = TableBaseProps<AnyRecord> & Omit<TableProps, keyof TableBaseProps<AnyRecord>>;

export interface MergedTableComponents {
    header: { outer: TableComponent; wrapper: TableComponent; row: TableComponent; cell: TableComponent };
    body: {
        outer: TableComponent;
        wrapper: TableComponent;
        row: TableComponent;
        cell: TableComponent;
        colgroup: { wrapper: TableComponent; col: TableComponent };
    };
}

export interface TableContextView {
    prefixCls: string;
    direction: 'ltr' | 'rtl';
    size: TableSize;
    anyColumnFixed: boolean;
    flattenedColumns: ColumnProps[];
    headWidths: BaseHeadWidth[][];
    headerStyle?: CSSProperties;
    rowSpanHover: boolean;
    /** The header and the body are separate elements, so their container is the table */
    splitTable: boolean;
    headerRowCount: number;
    virtualized: boolean;
    components: MergedTableComponents;
    tableLayout: 'fixed' | 'auto';
    bodyHasScrollbar: boolean;
    queries: ColumnProps[];
    scroll?: TableScroll;
    sticky?: TableSticky;
    showHeader: boolean;
    virtualizedProps?: TableVirtualizedProps;
    childrenRecordName: string;
    indentSize: number;
    hideExpandedColumn: boolean;
    expandIcon?: boolean;
    expandRowByClick: boolean;
    keepDOM: boolean;
    clickGroupedRowToExpand: boolean;
    hasExpandedRow: boolean;
    onRow: TableProps['onRow'];
    onHeaderRow: TableProps['onHeaderRow'];
    onGroupedRow: TableProps['onGroupedRow'];
    groupSectionColumn: TableProps['groupSectionColumn'];
}

export interface TableRowState {
    rowSelection?: TableBaseStateRowSelection<AnyRecord>;
    filteredDisabledRowKeysSet: Set<BaseRowKeyType>;
    halfCheckedRowKeysSet: Set<BaseRowKeyType>;
    filteredSortedRowKeys: BaseRowKeyType[];
    filteredSortedRowKeysSet: Set<BaseRowKeyType>;
    expandedRowKeys: BaseRowKeyType[];
    expandIcon?: boolean;
    /** Resolved, `'key'` by default */
    rowKey: TableRowKey;
}

export type RowEventName = 'rowMouseEnter' | 'rowMouseLeave' | 'rowDoubleClick' | 'rowContextMenu';

export interface TableContext {
    view: ComputedRef<TableContextView>;
    rowState: ComputedRef<TableRowState>;
    foundation: TableFoundation<AnyRecord, TableFoundationProps>;
    slots: TableSlots;
    /**
     * The slot of a `Table.Column` child, else the Table slot of that name (`title` falls back to `headerCell`);
     * undefined when neither is given
     */
    resolveColumnSlot: (name: string, column: ColumnProps) => RawSlots[string];
    /** The title of a header cell: the output of a `#title` or `#headerCell` slot, else `column.title` */
    renderTitle: (column: ColumnProps, titleProps: TableHeaderCellSlotProps) => KeyedNode[] | string | undefined;
    setHeadWidths: (widths: BaseHeadWidth[], index: number) => void;
    /** The measured widths of the given leaf columns, in order; empty before the header is measured */
    getCellWidths: (columns: ColumnProps[]) => number[];
    setBodyHasScrollbar: (hasScrollbar: boolean) => void;
    handleBodyScroll: (event: Event) => void;
    handleRowExpanded: (expanded: boolean, rowKey: BaseRowKeyType, event?: Event) => void;
    handleRowSelection: (rowKey: BaseRowKeyType, selected: boolean, event: Event) => void;
    rowExpandable: (record: AnyRecord) => boolean;
    emitRowEvent: (name: RowEventName, record: AnyRecord, event: MouseEvent) => void;
    getProps: () => TableProps;
    getState: () => TableState;
}

export const [provideTableContext, useTableContext] = createContext<TableContext>('Table');
