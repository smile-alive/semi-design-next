import type { Snippet } from 'svelte';
import type TableFoundation from '@fibrae/semi-foundation/components/table/foundation';
import type { BaseHeadWidth, BaseRowKeyType, TableBaseProps, TableBaseState, TableBaseStateRowSelection } from '@fibrae/semi-foundation/components/table/foundation';
import { createContext } from '../../base/index.js';
import type { ColumnProps, TableExpandIconSnippetProps, TableProps, TableRowKey, TableScroll, TableSize, TableSticky, TableVirtualizedProps } from './interface.js';

type AnyRecord = Record<string, any>;

export type TableState = TableBaseState<AnyRecord>;
export type TableFoundationProps = TableBaseProps<AnyRecord> & Omit<TableProps, keyof TableBaseProps<AnyRecord>>;

export interface MergedTableComponents {
    header: { outer: string; wrapper: string; row: string; cell: string };
    body: { outer: string; wrapper: string; row: string; cell: string; colgroup: { wrapper: string; col: string } };
}

export type TableParts = Readonly<
    Pick<TableProps, 'cell' | 'headerCell' | 'expandedRow' | 'groupSection' | 'sortIcon' | 'filterIcon' | 'filterDropdown' | 'filterDropdownItem' | 'selectionCell' | 'paginationContent' | 'onRow' | 'onHeaderRow' | 'onGroupedRow' | 'groupSectionColumn'> & {
        expandIcon?: Snippet<[TableExpandIconSnippetProps]>;
    }
>;

export type RowEventName = 'onRowMouseEnter' | 'onRowMouseLeave' | 'onRowDoubleClick' | 'onRowContextMenu';

export interface TableContextValue {
    readonly prefixCls: string;
    readonly direction: 'ltr' | 'rtl';
    readonly size: TableSize;
    readonly anyColumnFixed: boolean;
    readonly flattenedColumns: ColumnProps[];
    readonly headWidths: BaseHeadWidth[][];
    readonly classNames?: TableProps['classNames'];
    readonly styles?: TableProps['styles'];
    readonly rowSpanHover: boolean;
    /** The header and the body are separate elements, so their container is the table */
    readonly splitTable: boolean;
    readonly headerRowCount: number;
    readonly virtualized: boolean;
    readonly components: MergedTableComponents;
    readonly tableLayout: 'fixed' | 'auto';
    readonly bodyHasScrollbar: boolean;
    readonly queries: ColumnProps[];
    readonly scroll?: TableScroll;
    readonly sticky?: TableSticky;
    readonly showHeader: boolean;
    readonly virtualizedProps?: TableVirtualizedProps;
    readonly childrenRecordName: string;
    readonly indentSize: number;
    readonly hideExpandedColumn: boolean;
    readonly showExpandIcon: boolean;
    readonly expandRowByClick: boolean;
    readonly keepDOM: boolean;
    readonly clickGroupedRowToExpand: boolean;
    readonly hasExpandedRow: boolean;
    readonly resizable: boolean;
    readonly rowSelection?: TableBaseStateRowSelection<AnyRecord>;
    readonly filteredDisabledRowKeysSet: Set<BaseRowKeyType>;
    readonly halfCheckedRowKeysSet: Set<BaseRowKeyType>;
    readonly filteredSortedRowKeys: BaseRowKeyType[];
    readonly filteredSortedRowKeysSet: Set<BaseRowKeyType>;
    readonly expandedRowKeys: BaseRowKeyType[];
    readonly rowKey: TableRowKey;
    readonly parts: TableParts;
    foundation: TableFoundation<AnyRecord, TableFoundationProps>;
    setHeadWidths: (widths: BaseHeadWidth[], index: number) => void;
    /** The measured widths of the given leaf columns, in order; empty before the header is measured */
    getCellWidths: (columns: ColumnProps[]) => number[];
    setBodyHasScrollbar: (hasScrollbar: boolean) => void;
    handleBodyScroll: (event: Event) => void;
    rowExpandable: (record: AnyRecord) => boolean;
    emitRowEvent: (name: RowEventName, record: AnyRecord, event: MouseEvent) => void;
    /** Drags a resizable column header to a new width; `phase` marks the start and the end of a drag */
    resizeColumn: (column: ColumnProps, phase: 'start' | 'move' | 'stop', width?: number) => void;
}

export const [getTableContext, setTableContext] = createContext<TableContextValue>('Table');
