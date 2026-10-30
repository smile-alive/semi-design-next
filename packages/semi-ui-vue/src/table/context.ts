import type { ComputedRef, CSSProperties } from 'vue';
import type TableFoundation from '@fibrae/semi-foundation/table/foundation';
import type { BaseHeadWidth, BaseRowKeyType, TableBaseProps, TableBaseState, TableBaseStateRowSelection } from '@fibrae/semi-foundation/table/foundation';
import { createContext } from '../_base/create-context';
import type { RawSlots } from '../_base/read-vnode';
import type { KeyedNode } from '../_base/slot-nodes';
import type { ColumnProps, TableComponent, TableHeaderCellSlotProps, TableProps, TableRowKey, TableScroll, TableSize, TableSlots, TableSticky, TableVirtualizedProps } from './interface';

type AnyRecord = Record<string, any>;

/**
 * The foundation's state. Its flattenColumns and queries hold the Vue column objects, typed as the foundation's
 * column type: a Vue onCell returns Vue attributes, which the foundation's column type does not describe
 */
export type TableState = TableBaseState<AnyRecord>;
/** The props the foundation reads: the Table props with the function props resolved */
export type TableFoundationProps = TableBaseProps<AnyRecord> & Omit<TableProps, keyof TableBaseProps<AnyRecord>>;

/** `components` merged over the default tags */
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

/** The data every part of the table renders from */
export interface TableContextView {
    prefixCls: string;
    direction: 'ltr' | 'rtl';
    size: TableSize;
    anyColumnFixed: boolean;
    /** The leaf columns, the selection and expand columns included */
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
    /** The sort and filter state of the columns */
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
    /** A `#expandedRow` slot is given */
    hasExpandedRow: boolean;
    onRow: TableProps['onRow'];
    onHeaderRow: TableProps['onHeaderRow'];
    onGroupedRow: TableProps['onGroupedRow'];
    groupSectionColumn: TableProps['groupSectionColumn'];
}

/** The selection and expansion state that selection cells and expand buttons read */
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
    /** The Table's own slots, called by the rows and cells in their own render */
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
    /** Whether the row gets an expand button */
    rowExpandable: (record: AnyRecord) => boolean;
    emitRowEvent: (name: RowEventName, record: AnyRecord, event: MouseEvent) => void;
    /** The props as the foundation sees them, with function defaults resolved */
    getProps: () => TableProps;
    getState: () => TableState;
}

/** The context the parts of a table read; they render only inside Table */
export const [provideTableContext, useTableContext] = createContext<TableContext>('Table');
