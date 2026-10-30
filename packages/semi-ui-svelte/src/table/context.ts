import type { Snippet } from 'svelte';
import type TableFoundation from '@fibrae/semi-foundation/table/foundation';
import type { BaseHeadWidth, BaseRowKeyType, TableBaseProps, TableBaseState, TableBaseStateRowSelection } from '@fibrae/semi-foundation/table/foundation';
import { createContext } from '../_base/create-context.js';
import type { ColumnProps, TableExpandIconSnippetProps, TableProps, TableRowKey, TableScroll, TableSize, TableSticky, TableVirtualizedProps } from './interface.js';

type AnyRecord = Record<string, any>;

export type TableState = TableBaseState<AnyRecord>;
/** The props the foundation reads: the Table props with the function props resolved */
export type TableFoundationProps = TableBaseProps<AnyRecord> & Omit<TableProps, keyof TableBaseProps<AnyRecord>>;

/** `components` merged over the default tags */
export interface MergedTableComponents {
    header: { outer: string; wrapper: string; row: string; cell: string };
    body: { outer: string; wrapper: string; row: string; cell: string; colgroup: { wrapper: string; col: string } };
}

export type TableParts = Readonly<
    Pick<TableProps, 'cell' | 'headerCell' | 'expandedRow' | 'groupSection' | 'sortIcon' | 'filterIcon' | 'filterDropdown' | 'filterDropdownItem' | 'selectionCell' | 'paginationContent' | 'onRow' | 'onHeaderRow' | 'onGroupedRow' | 'groupSectionColumn'> & {
        expandIcon: Snippet<[TableExpandIconSnippetProps]> | undefined;
    }
>;

export type RowEventName = 'onRowMouseEnter' | 'onRowMouseLeave' | 'onRowDoubleClick' | 'onRowContextMenu';

/** What every part of the table renders from; the fields are getters, so readers stay reactive */
export interface TableContextValue {
    readonly prefixCls: string;
    readonly direction: 'ltr' | 'rtl';
    readonly size: TableSize;
    readonly anyColumnFixed: boolean;
    /** The leaf columns, the selection and expand columns included */
    readonly flattenedColumns: ColumnProps[];
    readonly headWidths: BaseHeadWidth[][];
    readonly headerStyle?: string;
    readonly rowSpanHover: boolean;
    /** The header and the body are separate elements, so their container is the table */
    readonly splitTable: boolean;
    readonly headerRowCount: number;
    readonly virtualized: boolean;
    readonly components: MergedTableComponents;
    readonly tableLayout: 'fixed' | 'auto';
    readonly bodyHasScrollbar: boolean;
    /** The sort and filter state of the columns */
    readonly queries: ColumnProps[];
    readonly scroll?: TableScroll;
    readonly sticky?: TableSticky;
    readonly showHeader: boolean;
    readonly virtualizedProps?: TableVirtualizedProps;
    readonly childrenRecordName: string;
    readonly indentSize: number;
    readonly hideExpandedColumn: boolean;
    /** `false` hides the expand buttons */
    readonly showExpandIcon: boolean;
    readonly expandRowByClick: boolean;
    readonly keepDOM: boolean;
    readonly clickGroupedRowToExpand: boolean;
    readonly hasExpandedRow: boolean;
    /** Numeric-width headers get a resize handle */
    readonly resizable: boolean;
    readonly rowSelection?: TableBaseStateRowSelection<AnyRecord>;
    readonly filteredDisabledRowKeysSet: Set<BaseRowKeyType>;
    readonly halfCheckedRowKeysSet: Set<BaseRowKeyType>;
    readonly filteredSortedRowKeys: BaseRowKeyType[];
    readonly filteredSortedRowKeysSet: Set<BaseRowKeyType>;
    readonly expandedRowKeys: BaseRowKeyType[];
    readonly rowKey: TableRowKey;
    /** The Table's snippets and row callbacks, as getters */
    readonly parts: TableParts;
    foundation: TableFoundation<AnyRecord, TableFoundationProps>;
    setHeadWidths: (widths: BaseHeadWidth[], index: number) => void;
    /** The measured widths of the given leaf columns, in order; empty before the header is measured */
    getCellWidths: (columns: ColumnProps[]) => number[];
    setBodyHasScrollbar: (hasScrollbar: boolean) => void;
    handleBodyScroll: (event: Event) => void;
    /** Whether the row gets an expand button */
    rowExpandable: (record: AnyRecord) => boolean;
    emitRowEvent: (name: RowEventName, record: AnyRecord, event: MouseEvent) => void;
    /** Drags a resizable column header to a new width; `phase` marks the start and the end of a drag */
    resizeColumn: (column: ColumnProps, phase: 'start' | 'move' | 'stop', width?: number) => void;
}

/** The context the parts of a table read; they render only inside Table */
export const [getTableContext, setTableContext] = createContext<TableContextValue>('Table');
