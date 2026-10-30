import type { JSX, Ref } from 'solid-js';
import type { BasicDataItem, OnSortEndProps } from '@fibrae/semi-foundation/transfer/foundation';
import type { ElementProps } from '../_base/element-props';
import type { SortableHandle } from '../_sortable/types';
import type { InputProps } from '../input';
import type { TreeProps } from '../tree';

export type { OnSortEndProps };

export interface DataItem extends BasicDataItem {
    /** The default filter matches it; markup goes through `renderLabel` */
    label?: string | number;
    fullPath?: Array<FullPathItem>;
}

export interface FullPathItem extends BasicDataItem {
    label?: string | number;
}

export interface GroupItem {
    title?: string;
    children?: Array<DataItem>;
}

export interface TreeItem extends DataItem {
    children: Array<TreeItem>;
}

/** `checked` is a getter: read it in the returned JSX */
export interface RenderSourceItemProps extends DataItem {
    readonly checked: boolean;
    onChange?: () => void;
}

export interface RenderSelectedItemProps extends DataItem {
    onRemove?: () => void;
    sortableHandle?: SortableHandle;
    /** The node's full path in treeList mode (only with showPath) */
    fullPath?: Array<FullPathItem>;
}

export interface EmptyContent {
    left?: JSX.Element;
    right?: JSX.Element;
    search?: JSX.Element;
}

export type Type = 'list' | 'groupList' | 'treeList';

export interface ResolvedDataItem extends DataItem {
    _parent?: Omit<GroupItem, 'children'>;
    _path?: Array<DataItem>;
    _isLeaf?: boolean;
}

export type DataSource = Array<DataItem> | Array<GroupItem> | Array<TreeItem>;

/** A live object: read its fields in the returned JSX, destructuring takes only the values of the first render */
export interface SourcePanelProps {
    value: Array<string | number>;
    loading?: boolean;
    noMatch: boolean;
    filterData: Array<DataItem>;
    sourceData: Array<DataItem>;
    propsDataSource: DataSource;
    allChecked: boolean;
    showNumber: number;
    inputValue: string;
    onSearch: (searchString: string) => void;
    onAllClick: () => void;
    selectedItems: Map<string | number, DataItem>;
    onSelectOrRemove: (item: DataItem) => void;
    onSelect: (value: Array<string | number>) => void;
}

export type OnSortEnd = (props: OnSortEndProps) => void;

/** A live object, as SourcePanelProps */
export interface SelectedPanelProps {
    length: number;
    selectedData: Array<DataItem>;
    onClear: () => void;
    onRemove: (item: DataItem) => void;
    onSortEnd: OnSortEnd;
}

export interface VirtualizeProps {
    /** A number is pixels; anything else fills the panel */
    height?: number | string;
    width?: number | string;
    itemSize: number;
}

export interface PaginationProps {
    /** Controlled page */
    currentPage?: number;
    /** Uncontrolled initial page */
    defaultCurrentPage?: number;
    /** Number of items per page */
    pageSize?: number;
    /** Callback when page changes */
    onPageChange?: (currentPage: number) => void;
}

/** A live object, as SourcePanelProps */
export interface SourceHeaderProps {
    num: number;
    showButton: boolean;
    allChecked: boolean;
    onAllClick: () => void;
    leafOnlyNum?: number;
}

/** A live object, as SourcePanelProps */
export interface SelectedHeaderProps {
    num: number;
    showButton: boolean;
    onClear: () => void;
}

export interface TransferState {
    /** The uncontrolled selection */
    selectedValues: Array<string | number>;
    inputValue: string;
    /** The uncontrolled left page; a numeric `pagination.currentPage` takes its place */
    leftCurrentPage: number;
}

/** React's TransferHandle methods; the root element passed to `ref` carries them */
export interface TransferHandle {
    /** Searches as if `value` were typed into the search box, without calling `onSearch` */
    search: (value: string) => void;
}

export type TransferElement = HTMLDivElement & TransferHandle;

// Transfer owns the Tree's value and data; its flat item map reads the fixed field names, so keyMaps and the other
// data shapes would make a check throw
export const TRANSFER_OWNED_TREE_PROPS = ['value', 'ref', 'onChange', 'keyMaps', 'treeData', 'treeDataSimpleJson', 'onChangeWithObject'] as const;

export interface TransferProps extends ElementProps<'div', 'defaultValue' | 'onChange' | 'onSelect' | 'onBlur' | 'ref'> {
    disabled?: boolean;
    dataSource?: DataSource;
    filter?: boolean | ((searchValue: string, item: DataItem) => boolean);
    /** Read once, when the Transfer is created */
    defaultValue?: Array<string | number>;
    value?: Array<string | number>;
    inputProps?: InputProps;
    type?: Type;
    emptyContent?: EmptyContent;
    draggable?: boolean;
    treeProps?: Omit<TreeProps, (typeof TRANSFER_OWNED_TREE_PROPS)[number]>;
    showPath?: boolean;
    loading?: boolean;
    virtualize?: VirtualizeProps;
    /** Pagination of the left panel */
    pagination?: PaginationProps;
    onChange?: (values: Array<string | number>, items: Array<DataItem>) => void;
    onSelect?: (item: DataItem) => void;
    onDeselect?: (item: DataItem) => void;
    onSearch?: (searchValue: string) => void;
    onBlur?: (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => void;
    /** Content of an item in both lists and of a node in treeList; the path with `showPath` stays text */
    renderLabel?: (item: DataItem) => JSX.Element;
    /** Called once per item */
    renderSourceItem?: (item: RenderSourceItemProps) => JSX.Element;
    /** Called once per item */
    renderSelectedItem?: (item: RenderSelectedItemProps) => JSX.Element;
    /** Called once with a live object */
    renderSourcePanel?: (sourcePanelProps: SourcePanelProps) => JSX.Element;
    /** Called once with a live object */
    renderSelectedPanel?: (selectedPanelProps: SelectedPanelProps) => JSX.Element;
    /** Called once with a live object */
    renderSourceHeader?: (headProps: SourceHeaderProps) => JSX.Element;
    /** Called once with a live object */
    renderSelectedHeader?: (headProps: SelectedHeaderProps) => JSX.Element;
    /** Lands on the search box: the root is not a focus target */
    tabIndex?: number | string;
    /** The root element, carrying the `TransferHandle` methods */
    ref?: Ref<TransferElement>;
}
