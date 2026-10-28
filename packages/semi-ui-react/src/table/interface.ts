import React, { type ReactNode } from 'react';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { strings } from '@fibrae/semi-foundation/table/constants';
import type { BaseRowKeyType, BaseSortOrder, BaseGroupBy, BaseGroupByFn, BaseFixed, BaseAlign, BaseChangeInfoSorter, BaseSorter, BaseFilter, BaseChangeInfoFilter, BaseIncludeGroupRecord, BaseEllipsis, BasePageData, OnChangeExtra } from '@fibrae/semi-foundation/table/foundation';
import type { ArrayElement, ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import type { CheckboxEvent, CheckboxProps } from '../checkbox';
import type { PaginationProps } from '../pagination';
import type { ExpandedRowRenderReturnType } from './body/expanded-row';
import type { ColumnFilterProps } from './column-filter';
import type { TableCellProps } from './table-cell';

export interface TableProps<RecordType extends Record<string, any> = any> extends BaseProps, ElementProps<'div', 'title' | 'onChange'> {
    bordered?: boolean;
    children?: ReactNode;
    childrenRecordName?: string;
    className?: string;
    clickGroupedRowToExpand?: boolean;
    columns?: ColumnProps<RecordType>[];
    components?: TableComponents;
    dataSource?: RecordType[];
    defaultExpandAllGroupRows?: boolean;
    defaultExpandAllRows?: boolean;
    defaultExpandedRowKeys?: (string | number)[];
    empty?: ReactNode;
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
    headerStyle?: React.CSSProperties;
    hideExpandedColumn?: boolean;
    id?: string;
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
    style?: React.CSSProperties;
    title?: Title<RecordType>;
    virtualized?: Virtualized;
    onChange?: OnChange<RecordType>;
    onExpand?: OnExpand<RecordType>;
    onExpandedRowsChange?: OnExpandedRowsChange<RecordType>;
    onGroupedRow?: OnGroupedRow<RecordType>;
    onHeaderRow?: OnHeaderRow<RecordType>;
    onRow?: OnRow<RecordType>;
    /** Called before the `onContextMenu` returned by `onRow` */
    onRowContextMenu?: (record: RecordType, e: React.MouseEvent<HTMLElement>) => void;
    /** Called before the `onDoubleClick` returned by `onRow` */
    onRowDoubleClick?: (record: RecordType, e: React.MouseEvent<HTMLElement>) => void;
    /** Called before the `onMouseEnter` returned by `onRow` */
    onRowMouseEnter?: (record: RecordType, e: React.MouseEvent<HTMLElement>) => void;
    /** Called before the `onMouseLeave` returned by `onRow` */
    onRowMouseLeave?: (record: RecordType, e: React.MouseEvent<HTMLElement>) => void;
    sticky?: Sticky;
    direction?: Direction;
    /** Exposes the table methods */
    ref?: React.Ref<TableHandle<RecordType>>;
}

export interface TableHandle<RecordType extends Record<string, any> = any> {
    /** The data of the current page, deep cloned: `{ dataSource, groups }` */
    getCurrentPageData: () => Pick<BasePageData<RecordType>, 'dataSource' | 'groups'>;
}

export interface ColumnProps<RecordType extends Record<string, any> = any> {
    align?: Align;
    children?: Array<ColumnProps<RecordType>>;
    className?: string;
    colSpan?: number;
    /** use `dataIndex` to get current column data item from record. If you use `sorter` or `onFilter`, a unique `dataIndex` is required  */
    dataIndex?: string;
    defaultFilteredValue?: any[];
    defaultSortOrder?: SortOrder;
    filterChildrenRecord?: boolean;
    filterDropdown?: ColumnFilterProps['filterDropdown'];
    /** render filter Dropdown panel content  */
    renderFilterDropdown?: ColumnFilterProps['renderFilterDropdown'];
    /** filter Dropdown props  */
    filterDropdownProps?: ColumnFilterProps['filterDropdownProps'];
    filterDropdownVisible?: boolean;
    filterIcon?: FilterIcon;
    filterMultiple?: boolean;
    /** filter confirm mode, 'immediate' means filter immediately when clicking option, 'confirm' means filter after clicking confirm button */
    filterConfirmMode?: FilterConfirmMode;
    filteredValue?: any[];
    /** `filters` is not required if you use `renderFilterDropdown`  */
    filters?: Filter[];
    fixed?: Fixed;
    /** the key required by React. If you have already set the `dataIndex`, the key does not need to be set again.  */
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
    resize?: boolean;
    showSortTip?: boolean;
    /**
     * self control whether to update cell for performance reasons
     */
    shouldCellUpdate?: (props: TableCellProps, prevProps: TableCellProps) => boolean;
}

export type Align = BaseAlign;
export type SortOrder = BaseSortOrder;
export type SortIcon = (props: { sortOrder: SortOrder }) => ReactNode;
export type FilterIcon = React.ReactElement | FilterIconRenderFunction;
export type FilterConfirmMode = 'immediate' | 'confirm';
export interface Filter extends BaseFilter {
    value?: any;
    text?: React.ReactNode;
    children?: Filter[];
}
export type Fixed = BaseFixed;
export type OnCell<RecordType> = (record?: RecordType, rowIndex?: number) => OnCellReturnObject;
export type OnFilter<RecordType> = (filteredValue: any, record: RecordType) => boolean;
export type OnFilterDropdownVisibleChange = (visible?: boolean) => void;
export type OnHeaderCell<RecordType extends Record<string, any>> = (column?: ColumnProps<RecordType>, columnIndex?: number, index?: number) => OnHeaderCellReturnObject;
export type ColumnRender<RecordType> = (text: any, record: RecordType, index: number, options: RenderOptions) => ColumnRenderReturnType;
export type RenderFilterDropdownItem = (itemInfo: FilterDropdownItem) => ReactNode;
export type Sorter<RecordType> = BaseSorter<RecordType>;
export type ColumnTitle = React.ReactNode | ((ColumnTitleProps: ColumnTitleProps) => React.ReactNode);
export type FilterIconRenderFunction = (filtered: boolean) => React.ReactNode;
export type ColumnTitleProps = {
    sorter?: React.ReactNode;
    filter?: React.ReactNode;
    selection?: React.ReactNode;
};
export type ColumnRenderReturnType = React.ReactNode | RenderReturnObject;
export interface RenderReturnObject {
    children: React.ReactNode;
    /** Merged into the td props; colSpan or rowSpan 0 skips the cell */
    props: React.TdHTMLAttributes<HTMLElement>;
}
export interface FilterDropdownItem {
    value?: any;
    text?: React.ReactNode;
    onChange?: React.MouseEventHandler<HTMLLIElement>;
    level?: number;
    filterMultiple?: boolean;
    checked?: boolean;
    /** The values checked in the menu, including unconfirmed ones in confirm mode */
    filteredValue?: any[];
}
export interface RenderOptions {
    expandIcon?: React.ReactNode;
    selection?: React.ReactNode;
    indentText?: React.ReactNode;
    /** Whether the current row is being hovered */
    isHovering?: boolean;
}
export interface OnCellReturnObject extends React.TdHTMLAttributes<HTMLElement> {
    style?: React.CSSProperties;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}
export interface OnHeaderCellReturnObject extends React.ThHTMLAttributes<HTMLElement> {
    style?: React.CSSProperties;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

interface OnRowReturnOmit {
    ref?: React.RefObject<any>;
}

export interface OnRowReturnObject extends Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>, keyof OnRowReturnOmit> {
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}
export interface OnGroupedRowReturnObject extends React.HTMLAttributes<HTMLTableRowElement> {
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
}
export type OnHeaderRowReturnObject = Omit<React.HTMLAttributes<HTMLTableRowElement>, 'ref' | 'style'>;

export interface Scroll {
    x?: number | string;
    y?: number | string;
    scrollToFirstRowOnChange?: boolean;
}

export interface Data {
    key?: string | number;
}

export type TableComponent<P> = React.ComponentType<P> | React.ForwardRefExoticComponent<P> | keyof React.JSX.IntrinsicElements;

export interface TableComponents {
    table?: TableComponent<any>;
    header?: {
        outer?: TableComponent<any>;
        wrapper?: TableComponent<any>;
        row?: TableComponent<any>;
        cell?: TableComponent<any>;
    };
    body?: {
        outer?: TableComponent<any>;
        wrapper?: TableComponent<any>;
        row?: TableComponent<any>;
        cell?: TableComponent<any>;
        colgroup?: {
            wrapper?: TableComponent<any>;
            col?: TableComponent<any>;
        };
    };
}

export interface RowSelectionProps<RecordType extends Record<string, any>> {
    className?: string;
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
    /**
     * self control whether to update cell for performance reasons
     */
    shouldCellUpdate?: (props: TableCellProps, prevProps: TableCellProps) => boolean;
}

export type RowSelectionRenderCell<RecordType> = (renderCellArgs: {
    selected: boolean;
    record: RecordType;
    originNode: React.JSX.Element;
    inHeader: boolean;
    disabled: boolean;
    indeterminate: boolean;
    index?: number;
    selectRow?: (selected: boolean, e: Event) => void;
    selectAll?: (selected: boolean, e: Event) => void;
}) => ReactNode;
export type GetCheckboxProps<RecordType> = (record: RecordType) => Omit<CheckboxProps, 'defaultChecked' | 'checked' | 'indeterminate' | 'onChange'>;
export type RowSelectionOnChange<RecordType> = (selectedRowKeys: (string | number)[], selectedRows: RecordType[]) => void;
// the selection checkbox passes its change event, a `clickRow` click its mouse event, and renderCell's selectRow and
// selectAll whatever the caller hands them
export type RowSelectionOnSelect<RecordType> = (record: RecordType, selected: boolean, selectedRows: RecordType[], nativeEvent: CheckboxEvent | React.MouseEvent | Event) => void;
export type RowSelectionOnSelectAll<RecordType> = (selected: boolean, selectedRows: RecordType[], changedRows: RecordType[], e: CheckboxEvent | Event) => void;
export type ExpandIcon = ((expanded?: boolean) => React.ReactNode) | React.ReactNode;
export type ExpandedRowRender<RecordType> = (record: RecordType, index: number, expanded: boolean) => ExpandedRowRenderReturnType;
export type Footer<RecordType> = ReactNode | ((pageData?: RecordType[]) => React.ReactNode);
export type FormatPageText = ((pageInfo?: { currentStart?: number; currentEnd?: number; total?: number }) => React.ReactNode) | boolean;
/**
 * Receives a ref to the virtual list's handle, which offers `scrollTo(offset)` and `scrollToItem(index, align)`
 *
 * only work when `virtualized` is truthy
 */
export type GetVirtualizedListRef = (
    ref: React.RefObject<{
        /**
         * Scroll to the specified vertical offset (scrollTop) in pixels.
         */
        scrollTo(scrollOffset: number): void;
        /**
         * Scroll to the specified item.
         *
         * By default, the List will scroll as little as possible to ensure the item is visible.
         * You can control the alignment of the item though by specifying a second alignment parameter. Acceptable values are:
         *
         * - auto (default) - Scroll as little as possible to ensure the item is visible. (If the item is already visible, it won't scroll at all.)
         * - smart
         *   - If the item is already visible, don't scroll at all.
         *   - If it is less than one viewport away, scroll as little as possible so that it becomes visible.
         *   - If it is more than one viewport away, scroll so that it is centered within the list.
         * - center - Center align the item within the list.
         * - end - Align the item to the end of the list (the bottom for vertical lists or the right for horizontal lists).
         * - start - Align the item to the beginning of the list (the top for vertical lists or the left for horizontal lists).
         */
        scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
    }>
) => void;
export type GroupByFunction<RecordType> = BaseGroupByFn<RecordType>;
export type GroupBy<RecordType> = BaseGroupBy<RecordType>;
export type Size = ArrayElement<typeof strings.SIZES>;
export type Title<RecordType> = React.ReactNode | ((pageData?: RecordType[]) => React.ReactNode);
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
export type OnExpand<RecordType> = (expanded: boolean, record: IncludeGroupRecord<RecordType>, mouseEvent: React.MouseEvent) => void;
export type RenderGroupSection = (
    groupKey?: string | number,
    group?: (string | number)[]
) =>
    | ReactNode
    // the other fields become the config of the section's single column
    | ({ children: ReactNode } & ColumnProps);
export type RenderPagination = (paginationProps: TablePaginationProps) => ReactNode;
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
    /** Added to the column's className while it is being resized */
    handlerClassName?: string;
}
/** The returned fields are merged into the column */
export type ResizeFn<RecordType extends Record<string, any>> = (column: ColumnProps<RecordType>) => ColumnProps<RecordType> | void;

export interface BodyScrollEvent extends React.UIEvent {
    currentTarget: any;
    target: any;
}

export type TableLocale = Locale['Table'];
export type Direction = 'ltr' | 'rtl';
export type IncludeGroupRecord<RecordType> = BaseIncludeGroupRecord<RecordType>;
export type Sticky =
    | boolean
    | {
          top?: number;
      };
