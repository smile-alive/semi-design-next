import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLTdAttributes, HTMLThAttributes } from 'svelte/elements';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { strings } from '@fibrae/semi-foundation/table/constants';
import type { BaseAlign, BaseChangeInfoFilter, BaseChangeInfoSorter, BaseEllipsis, BaseFixed, BaseIncludeGroupRecord, BasePageData, CheckRelation, OnChangeExtra } from '@fibrae/semi-foundation/table/foundation';
import type { CheckboxProps } from '../checkbox/interface.js';
import type { DropdownProps } from '../dropdown/interface.js';
import type { PaginationProps } from '../pagination/interface.js';

type ArrayElement<T extends readonly unknown[]> = T[number];
type AnyRecord = Record<string, any>;

export type ColumnAlign = BaseAlign;
export type ColumnFixed = BaseFixed;
export type SortOrder = boolean | 'ascend' | 'descend';
export type FilterConfirmMode = 'immediate' | 'confirm';
export type TableSize = ArrayElement<typeof strings.SIZES>;
export type TablePaginationPosition = ArrayElement<typeof strings.PAGINATION_POSITIONS>;
export type TableRowKey<R = AnyRecord> = string | number | ((record: R) => string | number);
export type GroupByFunction<R = AnyRecord> = (record?: R) => string | number;
export type TableGroupBy<R = AnyRecord> = string | number | GroupByFunction<R>;
export type TableSorter<R = AnyRecord> = boolean | ((a: R, b: R, sortOrder?: 'ascend' | 'descend') => number);
export type TableOnFilter<R = AnyRecord> = (value: any, record: R) => boolean;
export type TableRowExpandable<R = AnyRecord> = (record: R) => boolean;
export type TableIncludeGroupRecord<R = AnyRecord> = BaseIncludeGroupRecord<R>;
export type { CheckRelation };

export interface TableFilter {
    value?: any;
    text?: string;
    children?: TableFilter[];
}

interface CellSpans {
    colspan?: number;
    rowspan?: number;
}
/** Attributes and lowercase listeners (`onclick`, `onmouseenter`) for a row; the row's own handling runs first */
export type TableRowAttrs = HTMLAttributes<HTMLElement>;
/** `colspan` or `rowspan` 0 leaves the cell out, for the cell another cell spans over */
export type TableCellAttrs = Omit<HTMLTdAttributes, 'colspan' | 'rowspan'> & CellSpans;
export type TableHeaderCellAttrs = Omit<HTMLThAttributes, 'colspan' | 'rowspan'> & CellSpans;

/** A column holds data only: markup goes to the Table's `cell`, `headerCell`, `sortIcon` and other snippets */
export interface ColumnProps<R extends AnyRecord = AnyRecord> {
    align?: ColumnAlign;
    children?: ColumnProps<R>[];
    class?: string;
    colSpan?: number;
    /** The path of the cell value in the record; sorter and onFilter need a unique one */
    dataIndex?: string;
    defaultFilteredValue?: any[];
    defaultSortOrder?: SortOrder;
    ellipsis?: BaseEllipsis;
    filterChildrenRecord?: boolean;
    /** Shows the filter button for a panel given by the Table's `filterDropdown` snippet */
    filterDropdown?: boolean;
    /** Props of the filter Dropdown; the trigger is always a click */
    filterDropdownProps?: Omit<DropdownProps, 'visible' | 'trigger' | 'children' | 'child' | 'content' | 'onVisibleChange'>;
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
    /** The `cell` and `headerCell` snippets replace the whole cell, with selection and indent passed as snippets */
    useFullRender?: boolean;
    width?: number | string;
    onCell?: (record: R, rowIndex: number) => TableCellAttrs;
    onFilter?: TableOnFilter<R>;
    onFilterDropdownVisibleChange?: (visible: boolean) => void;
    onHeaderCell?: (column: ColumnProps<R>, columnIndex: number, rowIndex: number) => TableHeaderCellAttrs;
}

export type CheckboxAttrs = Omit<CheckboxProps, 'checked' | 'indeterminate' | 'onChange'>;
export type GetCheckboxProps<R extends AnyRecord = AnyRecord> = (record: R) => CheckboxAttrs;
export type RowSelectionOnChange<R extends AnyRecord = AnyRecord> = (selectedRowKeys: (string | number)[], selectedRows: R[]) => void;
export type RowSelectionOnSelect<R extends AnyRecord = AnyRecord> = (record: R, selected: boolean, selectedRows: R[], event: Event) => void;
export type RowSelectionOnSelectAll<R extends AnyRecord = AnyRecord> = (selected: boolean, selectedRows: R[], changedRows: R[], event: Event) => void;

export interface RowSelectionProps<R extends AnyRecord = AnyRecord> {
    class?: string;
    disabled?: boolean;
    fixed?: ColumnFixed;
    getCheckboxProps?: GetCheckboxProps<R>;
    hidden?: boolean;
    /** Controlled when given; pair it with `onChange` */
    selectedRowKeys?: (string | number)[];
    /** The initial selection of an uncontrolled table: `selectedRowKeys` lives in an object, which `bind:` cannot reach */
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

export interface TablePaginationProps extends Omit<PaginationProps, 'onChange'> {
    position?: TablePaginationPosition;
    formatPageText?: FormatPageText;
    onChange?: (currentPage: number, pageSize: number) => void;
}

export interface ResizableProps<R extends AnyRecord = AnyRecord> {
    onResize?: TableResizeFn<R>;
    onResizeStart?: TableResizeFn<R>;
    onResizeStop?: TableResizeFn<R>;
    /** Added to the column's class while it is resized */
    handlerClassName?: string;
}
/** The returned fields are merged into the column */
export type TableResizeFn<R extends AnyRecord = AnyRecord> = (column: ColumnProps<R>) => Partial<ColumnProps<R>> | void;

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

/** A tag name; the element replaces the default tag of that part */
export type TableComponent = string;
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

export type TableChangeInfoFilter<R extends AnyRecord = AnyRecord> = BaseChangeInfoFilter<R> & { filters?: TableFilter[] };
export type TableChangeInfoSorter<R extends AnyRecord = AnyRecord> = BaseChangeInfoSorter<R>;
export interface TableChangeInfo<R extends AnyRecord = AnyRecord> {
    pagination?: TablePaginationProps;
    filters?: TableChangeInfoFilter<R>[];
    sorter?: TableChangeInfoSorter<R>;
    extra?: OnChangeExtra;
}

export interface TableCellSnippetProps<R extends AnyRecord = AnyRecord> {
    /** The value at `column.dataIndex`, the record itself for a column without one */
    text: any;
    record: R;
    index: number;
    column: ColumnProps<R>;
    /** The row's expand button, on the first data cell of an expandable row */
    expandIcon?: Snippet;
    isHovering: boolean;
    /** With `useFullRender` only */
    selection?: Snippet;
    /** With `useFullRender` only */
    indentText?: Snippet;
}

export interface TableHeaderCellSnippetProps<R extends AnyRecord = AnyRecord> {
    column: ColumnProps<R>;
    title?: string;
    /** With `useFullRender` only */
    sorter?: Snippet;
    filter?: Snippet;
    selection?: Snippet;
}

export interface TableTitleSnippetProps<R extends AnyRecord = AnyRecord> {
    /** The records of the current page */
    pageData: R[];
}

export interface TableExpandedRowSnippetProps<R extends AnyRecord = AnyRecord> {
    record: R;
    index: number;
    expanded: boolean;
}

export interface TableGroupSectionSnippetProps {
    groupKey: string | number;
    group: (string | number)[];
}

export interface TableSortIconSnippetProps<R extends AnyRecord = AnyRecord> {
    sortOrder: SortOrder;
    column: ColumnProps<R>;
}

export interface TableFilterIconSnippetProps<R extends AnyRecord = AnyRecord> {
    /** The column has a filtered value applied */
    filtered: boolean;
    column: ColumnProps<R>;
}

export interface TableFilterDropdownSnippetProps<R extends AnyRecord = AnyRecord> {
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

export interface TableFilterDropdownItemSnippetProps<R extends AnyRecord = AnyRecord> {
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

export interface TableSelectionCellSnippetProps<R extends AnyRecord = AnyRecord> {
    selected: boolean;
    /** Absent in the header */
    record?: R;
    index?: number;
    inHeader: boolean;
    disabled?: boolean;
    indeterminate: boolean;
    /** The default checkbox */
    originNode: Snippet;
    /** Row cells only */
    onSelectRow?: (selected: boolean, event: Event) => void;
    /** The header cell only */
    onSelectAll?: (selected: boolean, event: Event) => void;
}

export interface TableExpandIconSnippetProps {
    expanded: boolean;
}

export interface TablePaginationSnippetProps {
    /** The props of the default Pagination, the page change handler included; spread it on a Pagination as is */
    pagination: Omit<TablePaginationProps, 'position' | 'formatPageText'>;
}

export interface TableVirtualizedScrollArgs {
    scrollOffset: number;
}

export interface TableProps<R extends AnyRecord = AnyRecord> extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onchange' | 'onscroll' | 'children'> {
    bordered?: boolean;
    childrenRecordName?: string;
    clickGroupedRowToExpand?: boolean;
    columns?: ColumnProps<R>[];
    components?: TableComponents;
    /**
     * Rows added or removed in place (push, splice on a `$state` array) are sorted and filtered again; a record field
     * changed in place shows in its cell but does not sort or filter again
     */
    /** Bindable; wins over `pagination.currentPage` because `bind:` cannot reach a field inside an object. Paging writes it back */
    currentPage?: number;
    dataSource?: R[];
    defaultExpandAllGroupRows?: boolean;
    defaultExpandAllRows?: boolean;
    direction?: 'ltr' | 'rtl';
    expandAllGroupRows?: boolean;
    expandAllRows?: boolean;
    expandCellFixed?: ColumnFixed;
    /** `false` hides the expand buttons; the `expandIcon` snippet replaces the icon */
    expandIcon?: boolean | Snippet<[TableExpandIconSnippetProps]>;
    /** Bindable; leave it out for uncontrolled expansion */
    expandedRowKeys?: (string | number)[];
    expandRowByClick?: boolean;
    footer?: string | Snippet<[TableTitleSnippetProps<R>]>;
    groupBy?: TableGroupBy<R>;
    /** The column config of a group section's single cell */
    groupSectionColumn?: (groupKey: string | number, group: (string | number)[]) => Omit<ColumnProps<R>, 'title' | 'children' | 'dataIndex'>;
    headerStyle?: string;
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
    /** Bindable; wins over `rowSelection.selectedRowKeys` because `bind:` cannot reach a field inside an object. Needs `rowSelection` to show the checkboxes */
    selectedRowKeys?: (string | number)[];
    showHeader?: boolean;
    size?: TableSize;
    sticky?: TableSticky;
    title?: string | Snippet<[TableTitleSnippetProps<R>]>;
    virtualized?: TableVirtualized;
    onChange?: (changeInfo: TableChangeInfo<R>) => void;
    onExpand?: (expanded: boolean, record: TableIncludeGroupRecord<R>, event: MouseEvent) => void;
    onExpandedRowsChange?: (expandedRows: TableIncludeGroupRecord<R>[]) => void;
    onGroupedRow?: (record: { groupKey: string | number; records: R[] }, index: number) => TableRowAttrs;
    onHeaderRow?: (columns: ColumnProps<R>[], index: number) => Omit<TableRowAttrs, 'style'>;
    onRow?: (record: R, index: number, rowState: { disabled: boolean; selected: boolean }) => TableRowAttrs;
    /** Called before the `onmouseenter` returned by `onRow` */
    onRowMouseEnter?: (record: R, event: MouseEvent) => void;
    onRowMouseLeave?: (record: R, event: MouseEvent) => void;
    onRowDoubleClick?: (record: R, event: MouseEvent) => void;
    onRowContextMenu?: (record: R, event: MouseEvent) => void;
    /** A virtualized body changed its vertical offset */
    onScroll?: (args: TableVirtualizedScrollArgs) => void;
    /** The content of a data cell; render `text` for the columns it leaves alone */
    cell?: Snippet<[TableCellSnippetProps<R>]>;
    /** The title of a column header; render `title` for the columns it leaves alone */
    headerCell?: Snippet<[TableHeaderCellSnippetProps<R>]>;
    /** Replaces the empty text */
    empty?: Snippet;
    /** The content of an expanded row; given, every expandable row gets an expand button */
    expandedRow?: Snippet<[TableExpandedRowSnippetProps<R>]>;
    groupSection?: Snippet<[TableGroupSectionSnippetProps]>;
    sortIcon?: Snippet<[TableSortIconSnippetProps<R>]>;
    /** The content of a column's filter button */
    filterIcon?: Snippet<[TableFilterIconSnippetProps<R>]>;
    /** The filter panel of a column with `filterDropdown: true` */
    filterDropdown?: Snippet<[TableFilterDropdownSnippetProps<R>]>;
    /** An item of a filter menu; given, it replaces every item */
    filterDropdownItem?: Snippet<[TableFilterDropdownItemSnippetProps<R>]>;
    /** A selection cell, header and rows */
    selectionCell?: Snippet<[TableSelectionCellSnippetProps<R>]>;
    /** Replaces the pagination info and Pagination; named apart from the `pagination` prop, which shares the namespace */
    paginationContent?: Snippet<[TablePaginationSnippetProps]>;
}

export type TableRowSelection<R extends AnyRecord = AnyRecord> = boolean | RowSelectionProps<R>;
export type TableResizable<R extends AnyRecord = AnyRecord> = boolean | ResizableProps<R>;
export type TableLocale = Locale['Table'];

export interface TableHandle<R extends AnyRecord = AnyRecord> {
    /** The data of the current page, deep cloned */
    getCurrentPageData: () => Pick<BasePageData<R>, 'dataSource' | 'groups'>;
    /** Virtualized only: scrolls the body to a vertical offset */
    scrollTo: (offset: number) => void;
    /** Virtualized only: scrolls the row at an index of the rendered rows into view */
    scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void;
}
