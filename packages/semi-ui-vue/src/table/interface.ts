import type { Component, CSSProperties, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, VNode } from 'vue';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { strings } from '@fibrae/semi-foundation/table/constants';
import type { BaseAlign, BaseChangeInfoFilter, BaseChangeInfoSorter, BaseEllipsis, BaseFixed, BaseIncludeGroupRecord, BasePageData, CheckRelation, OnChangeExtra } from '@fibrae/semi-foundation/table/foundation';
import type { VirtualListAlign, VirtualListScrollArgs } from '../_base/virtual-list.vue';
import type { CheckboxProps } from '../checkbox/interface';
import type { DropdownProps } from '../dropdown/interface';
import type { PaginationProps } from '../pagination/interface';

type ArrayElement<T extends readonly unknown[]> = T[number];

export type ColumnAlign = BaseAlign;
export type ColumnFixed = BaseFixed;
// Spelled out because compiler-sfc cannot resolve the `typeof` behind BaseSortOrder and would emit `type: Boolean`
export type SortOrder = boolean | 'ascend' | 'descend';
export type FilterConfirmMode = 'immediate' | 'confirm';
export type TableSize = ArrayElement<typeof strings.SIZES>;
export type TablePaginationPosition = ArrayElement<typeof strings.PAGINATION_POSITIONS>;
export type TableRowKey<R = Record<string, any>> = string | number | ((record: R) => string | number);
export type GroupByFunction<R = Record<string, any>> = (record?: R) => string | number;
export type TableGroupBy<R = Record<string, any>> = string | number | GroupByFunction<R>;
export type TableSorter<R = Record<string, any>> = boolean | ((a: R, b: R, sortOrder?: 'ascend' | 'descend') => number);
export type TableOnFilter<R = Record<string, any>> = (value: any, record: R) => boolean;
export type TableRowExpandable<R = Record<string, any>> = (record: R) => boolean;
export type TableIncludeGroupRecord<R = Record<string, any>> = BaseIncludeGroupRecord<R>;

export interface TableFilter {
    value?: any;
    text?: string;
    children?: TableFilter[];
}

type DataAttrs = { [key: `data-${string}`]: unknown };
interface CellSpans {
    colSpan?: number;
    rowSpan?: number;
}
/** Attributes, `class`, `style` and Vue listener keys (`onClick`, `onMouseenter`) for an element Table renders */
export type TableRowAttrs = HTMLAttributes & DataAttrs;
/** As TableRowAttrs; `colSpan` or `rowSpan` 0 leaves the cell out, for the cell another cell spans over */
export type TableCellAttrs = TdHTMLAttributes & CellSpans & DataAttrs;
/** As TableCellAttrs; a component header cell (`components.header.cell`) also gets the resizable fields */
export type TableHeaderCellAttrs = ThHTMLAttributes &
    CellSpans &
    DataAttrs & {
        width?: number | string;
        onResize?: (...args: any[]) => void;
        onResizeStart?: (...args: any[]) => void;
        onResizeStop?: (...args: any[]) => void;
    };

/**
 * A column holds data only: the cell content goes to the `#cell` slot and a title with markup to `#headerCell`, or to
 * the `#cell` and `#title` slots of a `Table.Column`
 */
export interface ColumnProps<R extends Record<string, any> = Record<string, any>> {
    align?: ColumnAlign;
    children?: ColumnProps<R>[];
    class?: HTMLAttributes['class'];
    colSpan?: number;
    /** The path of the cell value in the record; sorter and onFilter need a unique one */
    dataIndex?: string;
    defaultFilteredValue?: any[];
    defaultSortOrder?: SortOrder;
    ellipsis?: BaseEllipsis;
    filterChildrenRecord?: boolean;
    /** Shows the filter button for a panel given by the `#filterDropdown` slot */
    filterDropdown?: boolean;
    /** Props and Vue listener keys of the filter Dropdown; the trigger is always a click */
    filterDropdownProps?: Omit<DropdownProps, 'visible' | 'trigger'> & { [key: `on${string}`]: unknown };
    filterDropdownVisible?: boolean;
    filterConfirmMode?: FilterConfirmMode;
    filterMultiple?: boolean;
    filteredValue?: any[];
    filters?: TableFilter[];
    fixed?: ColumnFixed;
    /** Identifies the column for selection, sorting, filtering and widths; derived from dataIndex or position if absent */
    key?: string | number;
    resize?: boolean;
    showSortTip?: boolean;
    sortChildrenRecord?: boolean;
    sortOrder?: SortOrder;
    sorter?: TableSorter<R>;
    /** Plain text: the default title, the ellipsis tooltip and the name of the sort button */
    title?: string;
    /** The `#cell` and `#headerCell` output replaces the whole cell, with selection and indent passed as nodes */
    useFullRender?: boolean;
    width?: number | string;
    onCell?: (record: R, rowIndex: number) => TableCellAttrs;
    onFilter?: TableOnFilter<R>;
    onFilterDropdownVisibleChange?: (visible: boolean) => void;
    onHeaderCell?: (column: ColumnProps<R>, columnIndex: number, rowIndex: number) => TableHeaderCellAttrs;
}

/** Props and attributes of a row's selection checkbox */
export type CheckboxAttrs = Omit<CheckboxProps, 'modelValue' | 'defaultChecked' | 'indeterminate'> & Record<string, unknown>;
export type GetCheckboxProps<R extends Record<string, any> = Record<string, any>> = (record: R) => CheckboxAttrs;
export type RowSelectionOnChange<R extends Record<string, any> = Record<string, any>> = (selectedRowKeys: (string | number)[], selectedRows: R[]) => void;
export type RowSelectionOnSelect<R extends Record<string, any> = Record<string, any>> = (record: R, selected: boolean, selectedRows: R[], event: Event) => void;
export type RowSelectionOnSelectAll<R extends Record<string, any> = Record<string, any>> = (selected: boolean, selectedRows: R[], changedRows: R[], event: Event) => void;

export interface RowSelectionProps<R extends Record<string, any> = Record<string, any>> {
    class?: HTMLAttributes['class'];
    disabled?: boolean;
    fixed?: ColumnFixed;
    getCheckboxProps?: GetCheckboxProps<R>;
    hidden?: boolean;
    selectedRowKeys?: (string | number)[];
    defaultSelectedRowKeys?: (string | number)[];
    width?: number | string;
    /** Clicking a row toggles its selection */
    clickRow?: boolean;
    checkRelation?: CheckRelation;
    onChange?: RowSelectionOnChange<R>;
    onSelect?: RowSelectionOnSelect<R>;
    onSelectAll?: RowSelectionOnSelectAll<R>;
    onCell?: ColumnProps<R>['onCell'];
    onHeaderCell?: ColumnProps<R>['onHeaderCell'];
}

export type FormatPageText = boolean | ((pageInfo: { currentStart: number; currentEnd: number; total: number }) => string);

export interface TablePaginationProps extends PaginationProps {
    position?: TablePaginationPosition;
    formatPageText?: FormatPageText;
    onChange?: (currentPage: number, pageSize: number) => void;
    onPageChange?: (currentPage: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

export interface ResizableProps<R extends Record<string, any> = Record<string, any>> {
    onResize?: TableResizeFn<R>;
    onResizeStart?: TableResizeFn<R>;
    onResizeStop?: TableResizeFn<R>;
    /** Added to the column's class while it is resized */
    handlerClassName?: string;
}
/** The returned fields are merged into the column */
export type TableResizeFn<R extends Record<string, any> = Record<string, any>> = (column: ColumnProps<R>) => Partial<ColumnProps<R>> | void;

export interface TableScroll {
    x?: number | string;
    /** A virtualized body needs a number */
    y?: number | string;
    scrollToFirstRowOnChange?: boolean;
}
export type TableSticky = boolean | { top?: number };

export interface TableVirtualizeItemSizeRow {
    sectionRow?: boolean;
    expandedRow?: boolean;
}
export type TableVirtualizedItemSizeFn = (index: number, row: TableVirtualizeItemSizeRow) => number;
export type TableVirtualizedItemSize = number | TableVirtualizedItemSizeFn;
export interface TableVirtualizedProps {
    /** Row height in pixels; 53, 45 or 37 by size when absent */
    itemSize?: TableVirtualizedItemSize;
    /** Rows rendered above and below the visible area */
    overscanCount?: number;
}
export type TableVirtualized = boolean | TableVirtualizedProps;

/** A tag name or a Vue component; a component gets the attributes and listeners of the element it replaces */
export type TableComponent = string | Component;
export interface TableComponents {
    header?: {
        outer?: TableComponent;
        wrapper?: TableComponent;
        row?: TableComponent;
        cell?: TableComponent;
    };
    body?: {
        outer?: TableComponent;
        wrapper?: TableComponent;
        row?: TableComponent;
        cell?: TableComponent;
        colgroup?: {
            wrapper?: TableComponent;
            col?: TableComponent;
        };
    };
}

export interface TableProps<R extends Record<string, any> = Record<string, any>> {
    bordered?: boolean;
    childrenRecordName?: string;
    clickGroupedRowToExpand?: boolean;
    /** Takes precedence over `Table.Column` children whenever given, an empty array included */
    columns?: ColumnProps<R>[];
    components?: TableComponents;
    /**
     * Rows added or removed in place (push, splice) are sorted and filtered again; a record field changed in place
     * shows in its cell but does not sort or filter again
     */
    dataSource?: R[];
    defaultExpandAllGroupRows?: boolean;
    defaultExpandAllRows?: boolean;
    defaultExpandedRowKeys?: (string | number)[];
    direction?: 'ltr' | 'rtl';
    expandAllGroupRows?: boolean;
    expandAllRows?: boolean;
    expandCellFixed?: ColumnFixed;
    /** `false` hides the expand buttons */
    expandIcon?: boolean;
    expandedRowKeys?: (string | number)[];
    expandRowByClick?: boolean;
    /** Plain text; the `#footer` slot takes precedence */
    footer?: string;
    groupBy?: TableGroupBy<R>;
    /** The column config of a group section's single cell */
    groupSectionColumn?: (groupKey: string | number, group: (string | number)[]) => Omit<ColumnProps<R>, 'title' | 'children' | 'dataIndex'>;
    headerStyle?: CSSProperties;
    hideExpandedColumn?: boolean;
    indentSize?: number;
    keepDOM?: boolean;
    loading?: boolean;
    pagination?: boolean | TablePaginationProps;
    prefixCls?: string;
    resizable?: boolean | ResizableProps<R>;
    rowExpandable?: TableRowExpandable<R>;
    rowKey?: TableRowKey<R>;
    rowSelection?: boolean | RowSelectionProps<R>;
    /** Hovering a cell with rowSpan highlights every row it spans */
    rowSpanHover?: boolean;
    scroll?: TableScroll;
    showHeader?: boolean;
    size?: TableSize;
    sticky?: TableSticky;
    /** Plain text; the `#title` slot takes precedence */
    title?: string;
    virtualized?: TableVirtualized;
    onGroupedRow?: (record: { groupKey: string | number; records: R[] }, index: number) => TableRowAttrs;
    onHeaderRow?: (columns: ColumnProps<R>[], index: number) => Omit<TableRowAttrs, 'style'>;
    /** The returned listeners run after the row's own handling and the `rowXxx` events */
    onRow?: (record: R, index: number, rowState: { disabled: boolean; selected: boolean }) => TableRowAttrs;
}

export type TableRowSelection<R extends Record<string, any> = Record<string, any>> = boolean | RowSelectionProps<R>;
export type TableResizable<R extends Record<string, any> = Record<string, any>> = boolean | ResizableProps<R>;
export type TableLocale = Locale['Table'];
export type { CheckRelation };

export type TableChangeInfoFilter<R extends Record<string, any> = Record<string, any>> = BaseChangeInfoFilter<R> & {
    filters?: TableFilter[];
};
export type TableChangeInfoSorter<R extends Record<string, any> = Record<string, any>> = BaseChangeInfoSorter<R>;
export interface TableChangeInfo<R extends Record<string, any> = Record<string, any>> {
    pagination?: TablePaginationProps;
    filters?: TableChangeInfoFilter<R>[];
    sorter?: TableChangeInfoSorter<R>;
    extra?: OnChangeExtra;
}

export interface TableEmits<R extends Record<string, any> = Record<string, any>> {
    change: [changeInfo: TableChangeInfo<R>];
    expand: [expanded: boolean, record: TableIncludeGroupRecord<R>, event: MouseEvent];
    expandedRowsChange: [expandedRows: TableIncludeGroupRecord<R>[]];
    'update:expandedRowKeys': [expandedRowKeys: (string | number)[]];
    /** A virtualized body changed its vertical offset; a horizontal scroll is not reported */
    scroll: [args: VirtualListScrollArgs];
    rowMouseEnter: [record: R, event: MouseEvent];
    rowMouseLeave: [record: R, event: MouseEvent];
    rowDoubleClick: [record: R, event: MouseEvent];
    rowContextMenu: [record: R, event: MouseEvent];
}

export interface TableCellSlotProps<R extends Record<string, any> = Record<string, any>> {
    /** The value at `column.dataIndex`, the record itself for a column without one */
    text: any;
    record: R;
    index: number;
    column: ColumnProps<R>;
    expandIcon: VNode | null;
    isHovering: boolean;
    /** With `useFullRender` only */
    selection: VNode | null;
    /** With `useFullRender` only */
    indentText: VNode | null;
}

export interface TableHeaderCellSlotProps<R extends Record<string, any> = Record<string, any>> {
    column: ColumnProps<R>;
    title?: string;
    /** With `useFullRender` only */
    sorter: VNode | null;
    filter: VNode | null;
    selection: VNode | null;
}

export interface TableTitleSlotProps<R extends Record<string, any> = Record<string, any>> {
    /** The records of the current page */
    pageData: R[];
}

export interface TableExpandedRowSlotProps<R extends Record<string, any> = Record<string, any>> {
    record: R;
    index: number;
    expanded: boolean;
}

export interface TableGroupSectionSlotProps {
    groupKey: string | number;
    group: (string | number)[];
}

export interface TableSortIconSlotProps<R extends Record<string, any> = Record<string, any>> {
    sortOrder: SortOrder;
    column: ColumnProps<R>;
}

export interface TableFilterIconSlotProps<R extends Record<string, any> = Record<string, any>> {
    /** The column has a filtered value applied */
    filtered: boolean;
    column: ColumnProps<R>;
}

export interface TableFilterDropdownSlotProps<R extends Record<string, any> = Record<string, any>> {
    column: ColumnProps<R>;
    filters?: TableFilter[];
    /** The value picked in the panel and not applied yet, else the applied one */
    tempFilteredValue?: any[];
    onTempFilteredValueChange: (value?: any[]) => void;
    /** Applies the temporary value, or the given one */
    onConfirm: (options?: { closeDropdown?: boolean; filteredValue?: any[] }) => void;
    /** Clears the temporary and the applied value */
    onClear: (options?: { closeDropdown?: boolean }) => void;
    onClose: () => void;
    /** Drops the temporary value, back to the applied one */
    onReset: () => void;
}

export interface TableFilterDropdownItemSlotProps<R extends Record<string, any> = Record<string, any>> {
    column: ColumnProps<R>;
    value: any;
    text?: string;
    checked: boolean;
    /** The value the menu shows: the temporary one in confirm mode */
    filteredValue: any[];
    filterMultiple: boolean;
    /** The depth of the menu the item sits in, 0 for the top menu */
    level: number;
    /** Toggles the item; bind it to the item's click */
    onChange: (event: MouseEvent) => void;
}

export interface TableSelectionCellSlotProps<R extends Record<string, any> = Record<string, any>> {
    selected: boolean;
    /** Absent in the header */
    record?: R;
    index?: number;
    inHeader: boolean;
    disabled?: boolean;
    indeterminate: boolean;
    /** The default checkbox */
    originNode: VNode;
    /** Row cells only */
    onSelectRow?: (selected: boolean, event: Event) => void;
    /** The header cell only */
    onSelectAll?: (selected: boolean, event: Event) => void;
}

export interface TableExpandIconSlotProps {
    expanded: boolean;
}

export interface TablePaginationSlotProps {
    /** The props of the default Pagination, the page change handler included; bind it to a Pagination as is */
    pagination: Omit<TablePaginationProps, 'position' | 'formatPageText'>;
}

export interface TableSlots<R extends Record<string, any> = Record<string, any>> {
    /** `Table.Column` children; ignored when `columns` is given */
    default?: () => VNode[];
    /** The content of a data cell; empty output shows the value */
    cell?: (props: TableCellSlotProps<R>) => VNode[];
    /** The title of a column header; empty output shows `column.title` */
    headerCell?: (props: TableHeaderCellSlotProps<R>) => VNode[];
    title?: (props: TableTitleSlotProps<R>) => VNode[];
    footer?: (props: TableTitleSlotProps<R>) => VNode[];
    /** Replaces the empty text; an empty slot shows nothing */
    empty?: () => VNode[];
    /** The content of an expanded row; empty output leaves the row out */
    expandedRow?: (props: TableExpandedRowSlotProps<R>) => VNode[];
    groupSection?: (props: TableGroupSectionSlotProps) => VNode[];
    /** The sort icon of a column; empty output shows the default arrows */
    sortIcon?: (props: TableSortIconSlotProps<R>) => VNode[];
    /** The content of a column's filter button; empty output shows the default icon */
    filterIcon?: (props: TableFilterIconSlotProps<R>) => VNode[];
    /** The filter panel of a column with `filterDropdown: true`; empty output shows the filter menu */
    filterDropdown?: (props: TableFilterDropdownSlotProps<R>) => VNode[];
    /** An item of a filter menu; empty output shows the default item */
    filterDropdownItem?: (props: TableFilterDropdownItemSlotProps<R>) => VNode[];
    /** A selection cell, header and rows; empty output shows the default checkbox */
    selectionCell?: (props: TableSelectionCellSlotProps<R>) => VNode[];
    /** The icon of an expand button; empty output shows the default icon */
    expandIcon?: (props: TableExpandIconSlotProps) => VNode[];
    /** Replaces the pagination info and Pagination; empty output shows them */
    pagination?: (props: TablePaginationSlotProps) => VNode[];
}

/** The slots a `Table.Column` takes for its own column, before the Table's slots of the same name */
export interface TableColumnSlots<R extends Record<string, any> = Record<string, any>> {
    /** Nested `Table.Column` children, grouped under this column's header */
    default?: () => VNode[];
    cell?: (props: TableCellSlotProps<R>) => VNode[];
    title?: (props: TableHeaderCellSlotProps<R>) => VNode[];
    sortIcon?: (props: TableSortIconSlotProps<R>) => VNode[];
    filterIcon?: (props: TableFilterIconSlotProps<R>) => VNode[];
    /** Marks the column as having a custom filter panel, as `filterDropdown: true` does */
    filterDropdown?: (props: TableFilterDropdownSlotProps<R>) => VNode[];
    filterDropdownItem?: (props: TableFilterDropdownItemSlotProps<R>) => VNode[];
}

export interface TableHandle<R extends Record<string, any> = Record<string, any>> {
    /** The data of the current page, deep cloned */
    getCurrentPageData: () => Pick<BasePageData<R>, 'dataSource' | 'groups'>;
    /** Virtualized only: scrolls the body to a vertical offset */
    scrollTo: (offset: number) => void;
    /** Virtualized only: scrolls the row at an index of the rendered rows into view */
    scrollToItem: (index: number, align?: VirtualListAlign) => void;
}
