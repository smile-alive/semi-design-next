import type { JSX, Ref } from 'solid-js';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { strings } from '@fibrae/semi-foundation/table/constants';
import type { BaseAlign, BaseChangeInfoFilter, BaseChangeInfoSorter, BaseEllipsis, BaseFilter, BaseFixed, BaseGroupBy, BaseGroupByFn, BaseIncludeGroupRecord, BasePageData, BaseRowKeyType, BaseSorter, BaseSortOrder, OnChangeExtra } from '@fibrae/semi-foundation/table/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { ElementProps } from '../_base/element-props';
import type { VirtualListHandle } from '../_base/virtual-list';
import type { CheckboxEvent, CheckboxProps } from '../checkbox';
import type { DropdownProps } from '../dropdown';
import type { PaginationProps } from '../pagination';

export interface TableProps<RecordType extends Record<string, any> = any> extends ElementProps<'div', 'title' | 'onChange' | 'ref'> {
    bordered?: boolean;
    /** `Table.Column` children, read when `columns` is not given */
    children?: JSX.Element;
    childrenRecordName?: string;
    clickGroupedRowToExpand?: boolean;
    columns?: ColumnProps<RecordType>[];
    components?: TableComponents;
    dataSource?: RecordType[];
    defaultExpandAllGroupRows?: boolean;
    defaultExpandAllRows?: boolean;
    defaultExpandedRowKeys?: (string | number)[];
    empty?: JSX.Element;
    expandAllGroupRows?: boolean;
    expandAllRows?: boolean;
    expandCellFixed?: Fixed;
    expandIcon?: ExpandIcon;
    expandedRowKeys?: (string | number)[];
    expandedRowRender?: ExpandedRowRender<RecordType>;
    expandRowByClick?: boolean;
    footer?: Footer<RecordType>;
    getVirtualizedListRef?: GetVirtualizedListRef;
    groupBy?: GroupBy<RecordType>;
    headerStyle?: JSX.CSSProperties;
    hideExpandedColumn?: boolean;
    indentSize?: number;
    keepDOM?: boolean;
    loading?: boolean;
    pagination?: TablePagination;
    prefixCls?: string;
    renderGroupSection?: RenderGroupSection;
    renderPagination?: RenderPagination;
    resizable?: Resizable<RecordType>;
    rowExpandable?: RowExpandable<RecordType>;
    rowKey?: RowKey<RecordType>;
    rowSelection?: RowSelection<RecordType>;
    /** Whether to highlight all related rows when hovering over a rowspan cell */
    rowSpanHover?: boolean;
    scroll?: Scroll;
    showHeader?: boolean;
    size?: Size;
    title?: Title<RecordType>;
    virtualized?: Virtualized;
    onChange?: OnChange<RecordType>;
    onExpand?: OnExpand<RecordType>;
    onExpandedRowsChange?: OnExpandedRowsChange<RecordType>;
    onGroupedRow?: OnGroupedRow<RecordType>;
    onHeaderRow?: OnHeaderRow<RecordType>;
    onRow?: OnRow<RecordType>;
    /** Called before the `onContextMenu` returned by `onRow` */
    onRowContextMenu?: (record: RecordType, e: MouseEvent) => void;
    /** Called before the `onDblClick` returned by `onRow` */
    onRowDoubleClick?: (record: RecordType, e: MouseEvent) => void;
    /** Called before the `onMouseEnter` returned by `onRow` */
    onRowMouseEnter?: (record: RecordType, e: MouseEvent) => void;
    /** Called before the `onMouseLeave` returned by `onRow` */
    onRowMouseLeave?: (record: RecordType, e: MouseEvent) => void;
    sticky?: Sticky;
    direction?: Direction;
    /** The root element with the TableHandle method */
    ref?: Ref<TableElement<RecordType>>;
}

export interface TableHandle<RecordType extends Record<string, any> = any> {
    /** The data of the current page, deep cloned: `{ dataSource, groups }` */
    getCurrentPageData: () => Pick<BasePageData<RecordType>, 'dataSource' | 'groups'>;
}

export type TableElement<RecordType extends Record<string, any> = any> = HTMLDivElement & TableHandle<RecordType>;

export interface ColumnProps<RecordType extends Record<string, any> = any> {
    align?: Align;
    children?: Array<ColumnProps<RecordType>>;
    class?: string;
    colSpan?: number;
    /** use `dataIndex` to get current column data item from record. If you use `sorter` or `onFilter`, a unique `dataIndex` is required  */
    dataIndex?: string;
    defaultFilteredValue?: any[];
    defaultSortOrder?: SortOrder;
    filterChildrenRecord?: boolean;
    /** Renders what replaces the filter trigger and its menu */
    filterDropdown?: () => JSX.Element;
    /** render filter Dropdown panel content  */
    renderFilterDropdown?: (props: RenderFilterDropdownProps) => JSX.Element;
    /** filter Dropdown props  */
    filterDropdownProps?: FilterDropdownProps;
    filterDropdownVisible?: boolean;
    filterIcon?: FilterIcon;
    filterMultiple?: boolean;
    /** filter confirm mode, 'immediate' means filter immediately when clicking option, 'confirm' means filter after clicking confirm button */
    filterConfirmMode?: FilterConfirmMode;
    filteredValue?: any[];
    /** `filters` is not required if you use `renderFilterDropdown`  */
    filters?: Filter[];
    fixed?: Fixed;
    /** Identifies the column; defaults to one built from `dataIndex` or the position */
    key?: string | number;
    render?: ColumnRender<RecordType>;
    renderFilterDropdownItem?: RenderFilterDropdownItem;
    sortChildrenRecord?: boolean;
    sortOrder?: SortOrder;
    /** enable sorting, `dataIndex` is required at the same time  */
    sorter?: Sorter<RecordType>;
    sortIcon?: SortIcon;
    title?: ColumnTitle;
    useFullRender?: boolean;
    width?: string | number;
    onCell?: OnCell<RecordType>;
    /** enable filtering, `dataIndex` is required at the same time  */
    onFilter?: OnFilter<RecordType>;
    onFilterDropdownVisibleChange?: OnFilterDropdownVisibleChange;
    onHeaderCell?: OnHeaderCell<RecordType>;
    ellipsis?: BaseEllipsis;
    /** With `resizable`, false leaves the column without a resize handle */
    resize?: boolean;
    showSortTip?: boolean;
}

export type Align = BaseAlign;
export type SortOrder = BaseSortOrder;
/** Called once; `sortOrder` is a live field, read it in the returned JSX */
export type SortIcon = (props: { readonly sortOrder: SortOrder }) => JSX.Element;
/** Called again when the filtered state changes */
export type FilterIcon = FilterIconRenderFunction;
export type FilterConfirmMode = 'immediate' | 'confirm';
/** Plain text: markup in an option goes to `renderFilterDropdownItem` */
export interface Filter extends BaseFilter {
    value?: any;
    text?: string;
    children?: Filter[];
}
export type Fixed = BaseFixed;
export type OnCell<RecordType> = (record?: RecordType, rowIndex?: number) => OnCellReturnObject;
export type OnFilter<RecordType> = (filteredValue: any, record: RecordType) => boolean;
export type OnFilterDropdownVisibleChange = (visible?: boolean) => void;
export type OnHeaderCell<RecordType extends Record<string, any>> = (column?: ColumnProps<RecordType>, columnIndex?: number, index?: number) => OnHeaderCellReturnObject;
/** Called again when the record or index changes; the fields of `options` are live, read them in the returned JSX */
export type ColumnRender<RecordType> = (text: any, record: RecordType, index: number, options: RenderOptions) => JSX.Element;
export type RenderFilterDropdownItem = (itemInfo: FilterDropdownItem) => JSX.Element;
export type Sorter<RecordType> = BaseSorter<RecordType>;
/** Text, or a function for markup; with `useFullRender` the function's argument has the parts of the header cell as render functions */
export type ColumnTitle = string | ((ColumnTitleProps: ColumnTitleProps) => JSX.Element);
export type FilterIconRenderFunction = (filtered: boolean) => JSX.Element;
/** Each part is missing when the column has none, and creates its node on every call: call one where it is inserted */
export type ColumnTitleProps = {
    readonly sorter?: () => JSX.Element;
    readonly filter?: () => JSX.Element;
    readonly selection?: () => JSX.Element;
};
export interface FilterDropdownItem {
    value?: any;
    text?: string;
    onChange?: (e: MouseEvent) => void;
    level?: number;
    filterMultiple?: boolean;
    checked?: boolean;
    /** The values checked in the menu, including unconfirmed ones in confirm mode */
    filteredValue?: any[];
}
/**
 * Live fields: a field read in the returned JSX follows the row. `expandIcon`, `selection` and `indentText` are render
 * functions that create their node on every call: call one where it is inserted
 */
export interface RenderOptions {
    readonly expandIcon?: () => JSX.Element;
    readonly selection?: () => JSX.Element;
    readonly indentText?: () => JSX.Element;
    /** Whether the current row is being hovered */
    readonly isHovering?: boolean;
}
/** Merged into the td attributes; colSpan or rowSpan 0 leaves the cell out, for the cell another cell spans over */
export type OnCellReturnObject = JSX.TdHTMLAttributes<HTMLElement>;
export type OnHeaderCellReturnObject = JSX.ThHTMLAttributes<HTMLElement>;
export type OnRowReturnObject = Omit<JSX.HTMLAttributes<HTMLTableRowElement>, 'ref'>;
export type OnGroupedRowReturnObject = Omit<JSX.HTMLAttributes<HTMLTableRowElement>, 'ref'>;
export type OnHeaderRowReturnObject = Omit<JSX.HTMLAttributes<HTMLTableRowElement>, 'ref' | 'style'>;

export interface Scroll {
    x?: number | string;
    y?: number | string;
    scrollToFirstRowOnChange?: boolean;
}

export interface Data {
    key?: string | number;
}

/** A tag name, or a component that renders the part and passes its props on to it */
export type TableComponent = keyof JSX.IntrinsicElements | ((props: any) => JSX.Element);

export interface TableComponents {
    table?: TableComponent;
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

export interface RowSelectionProps<RecordType extends Record<string, any>> {
    class?: string;
    disabled?: boolean;
    fixed?: Fixed;
    getCheckboxProps?: GetCheckboxProps<RecordType>;
    hidden?: boolean;
    selectedRowKeys?: (string | number)[];
    /** Selected row keys on mount when selectedRowKeys is not set */
    defaultSelectedRowKeys?: (string | number)[];
    width?: string | number;
    /** Whether to enable click row to select */
    clickRow?: boolean;
    /** When set to 'related', parent and child nodes will be associated during selection. Default is 'unRelated' */
    checkRelation?: CheckRelation;
    onChange?: RowSelectionOnChange<RecordType>;
    onSelect?: RowSelectionOnSelect<RecordType>;
    onSelectAll?: RowSelectionOnSelectAll<RecordType>;
    onCell?: OnCell<RecordType>;
    onHeaderCell?: OnHeaderCell<RecordType>;
    renderCell?: RowSelectionRenderCell<RecordType>;
}

/** Called once per cell; the fields are live, read them in the returned JSX; `originNode` creates the default checkbox on each call */
export type RowSelectionRenderCell<RecordType> = (renderCellArgs: {
    readonly selected: boolean;
    readonly record: RecordType;
    readonly originNode: () => JSX.Element;
    readonly inHeader: boolean;
    readonly disabled: boolean;
    readonly indeterminate: boolean;
    readonly index?: number;
    readonly selectRow?: (selected: boolean, e: Event) => void;
    readonly selectAll?: (selected: boolean, e: Event) => void;
}) => JSX.Element;
export type GetCheckboxProps<RecordType> = (record: RecordType) => Omit<CheckboxProps, 'defaultChecked' | 'checked' | 'indeterminate' | 'onChange'>;
export type RowSelectionOnChange<RecordType> = (selectedRowKeys: (string | number)[], selectedRows: RecordType[]) => void;
// the selection checkbox passes its change event, a `clickRow` click its mouse event, and renderCell's selectRow and
// selectAll whatever the caller hands them
export type RowSelectionOnSelect<RecordType> = (record: RecordType, selected: boolean, selectedRows: RecordType[], nativeEvent: CheckboxEvent | MouseEvent | Event) => void;
export type RowSelectionOnSelectAll<RecordType> = (selected: boolean, selectedRows: RecordType[], changedRows: RecordType[], e: CheckboxEvent | Event) => void;
/** A node, or a function called again when the expanded state changes */
export type ExpandIcon = ((expanded?: boolean) => JSX.Element) | JSX.Element;
export type ExpandedRowRender<RecordType> = (record: RecordType, index: number, expanded: boolean) => ExpandedRowRenderReturnType;
export type ExpandedRowRenderReturnType = JSX.Element | ({ children: JSX.Element; fixed?: Fixed } & Omit<ColumnProps, 'children'>);
export type Footer<RecordType> = JSX.Element | ((pageData?: RecordType[]) => JSX.Element);
export type FormatPageText = ((pageInfo?: { currentStart?: number; currentEnd?: number; total?: number }) => JSX.Element) | boolean;
/** Called with the handle of the virtual list each time a virtualized body creates its list */
export type GetVirtualizedListRef = (list: Pick<VirtualListHandle, 'scrollTo' | 'scrollToItem'>) => void;
export type GroupByFunction<RecordType> = BaseGroupByFn<RecordType>;
export type GroupBy<RecordType> = BaseGroupBy<RecordType>;
export type Size = ArrayElement<typeof strings.SIZES>;
export type Title<RecordType> = JSX.Element | ((pageData?: RecordType[]) => JSX.Element);
export type PaginationPosition = ArrayElement<typeof strings.PAGINATION_POSITIONS>;
export type Pagination = TablePaginationProps | boolean;
export type TablePagination = Pagination;
export interface ChangeInfoFilter<RecordType> extends BaseChangeInfoFilter<RecordType> {
    filters?: Filter[];
    onFilter?: OnFilter<RecordType>;
}
export type ChangeInfoSorter<RecordType> = BaseChangeInfoSorter<RecordType>;
export interface ChangeInfo<RecordType> {
    pagination?: TablePaginationProps;
    filters?: ChangeInfoFilter<RecordType>[];
    sorter?: ChangeInfoSorter<RecordType>;
    extra?: OnChangeExtra;
}
export type OnChange<RecordType> = (changeInfo: ChangeInfo<RecordType>) => void;
export type OnRow<RecordType> = (record: RecordType, index: number, rowStatus: { disabled?: boolean; selected?: boolean }) => OnRowReturnObject;
export type OnGroupedRow<RecordType> = (record: { groupKey: string | number; records: RecordType[] }, index: number) => OnGroupedRowReturnObject;
export type OnHeaderRow<RecordType extends Record<string, any>> = (columns?: ColumnProps<RecordType>[], index?: number) => OnHeaderRowReturnObject;
export type OnExpandedRowsChange<RecordType> = (expandedRows: IncludeGroupRecord<RecordType>[]) => void;
export type OnExpand<RecordType> = (expanded: boolean, record: IncludeGroupRecord<RecordType>, mouseEvent: MouseEvent) => void;
/** The other fields of the object form become the config of the section's single column */
export type RenderGroupSection = (groupKey?: string | number, group?: (string | number)[]) => JSX.Element | ({ children: JSX.Element } & ColumnProps);
export type RenderPagination = (paginationProps: TablePaginationProps) => JSX.Element;
export type RowExpandable<RecordType> = (record: RecordType) => boolean;
export type RowKey<RecordType> = BaseRowKeyType | ((record: RecordType) => BaseRowKeyType);
export type RowSelection<RecordType extends Record<string, any>> = RowSelectionProps<RecordType> | boolean;

export type CheckRelation = 'related' | 'unRelated';

export type VirtualizedOnScrollArgs = {
    scrollDirection?: 'forward' | 'backward';
    scrollOffset?: number;
    scrollUpdateWasRequested?: boolean;
};

export type VirtualizeItemSizeRow = {
    sectionRow?: boolean;
    expandedRow?: boolean;
};
export type VirtualizedItemSizeFn = (index?: number, row?: VirtualizeItemSizeRow) => number;
export type VirtualizedItemSize = number | VirtualizedItemSizeFn;
export type VirtualizedOnScroll = (object: VirtualizedOnScrollArgs) => void;
export interface VirtualizedProps {
    itemSize?: VirtualizedItemSize;
    onScroll?: VirtualizedOnScroll;
    /** Rows rendered above and below the visible area */
    overscanCount?: number;
}
export type Virtualized = boolean | VirtualizedProps;

export interface TablePaginationProps extends PaginationProps {
    position?: PaginationPosition;
    formatPageText?: FormatPageText;
}

export type Resizable<RecordType extends Record<string, any>> = ResizableProps<RecordType> | boolean;
export interface ResizableProps<RecordType extends Record<string, any>> {
    onResize?: ResizeFn<RecordType>;
    onResizeStart?: ResizeFn<RecordType>;
    onResizeStop?: ResizeFn<RecordType>;
    /** Added to the column's class while it is being resized */
    handlerClassName?: string;
}
/** The returned fields are merged into the column */
export type ResizeFn<RecordType extends Record<string, any>> = (column: ColumnProps<RecordType>) => ColumnProps<RecordType> | void;

export interface FilterDropdownProps extends Omit<DropdownProps, 'render' | 'onVisibleChange'> {}

/** Called once; the fields are live, read them in the returned JSX */
export interface RenderFilterDropdownProps {
    /** temporary filteredValue  */
    readonly tempFilteredValue: any[];
    /** set temporary filteredValue  */
    readonly setTempFilteredValue: (tempFilteredValue: any[]) => void;
    /** set tempFilteredValue to filteredValue. You can also pass filteredValue to directly set the filteredValue  */
    readonly confirm: (props?: { closeDropdown?: boolean; filteredValue?: any[] }) => void;
    /** clear tempFilteredValue and filteredValue  */
    readonly clear: (props?: { closeDropdown?: boolean }) => void;
    /** close dropdown  */
    readonly close: () => void;
    /** reset tempFilteredValue to the applied filteredValue  */
    readonly reset: () => void;
    /** column filters  */
    readonly filters?: Filter[];
}

export type TableLocale = Locale['Table'];
export type Direction = 'ltr' | 'rtl';
export type IncludeGroupRecord<RecordType> = BaseIncludeGroupRecord<RecordType>;
export type Sticky =
    | boolean
    | {
          top?: number;
      };
