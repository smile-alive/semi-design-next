import type { Component, HTMLAttributes, StyleValue, VNode } from 'vue';
import type { InputProps } from '../input/interface';
import type { TreeProps } from '../tree/interface';

export type TransferType = 'list' | 'groupList' | 'treeList';

export type TransferValue = Array<string | number>;

/** An entry of the dataSource; extra fields reach the slots and events unchanged */
export interface TransferDataItem {
    [key: string]: unknown;
    key: string | number;
    value?: string | number;
    /** The default filter matches it; render other content with `#label` */
    label?: string;
    disabled?: boolean;
    /** The nodes from the root to this one, in treeList mode with `showPath` */
    fullPath?: TransferDataItem[];
}

export interface TransferGroupItem {
    title?: string;
    children?: TransferDataItem[];
}

export interface TransferTreeItem extends TransferDataItem {
    children: TransferTreeItem[];
}

export type TransferDataSource = TransferDataItem[] | TransferGroupItem[] | TransferTreeItem[];

export interface TransferVirtualize {
    height?: number | string;
    width?: number | string;
    itemSize: number;
}

export interface TransferPagination {
    /** Controlled page of the left list */
    currentPage?: number;
    defaultCurrentPage?: number;
    pageSize?: number;
    onPageChange?: (currentPage: number) => void;
}

export type TransferOnSortEnd = (payload: { oldIndex: number; newIndex: number }) => void;

/** Extra attributes of the search Input; listeners use Vue keys such as `onKeydown` */
export type TransferInputProps = Omit<InputProps, 'modelValue' | 'defaultValue'> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    [key: string]: unknown;
};

/**
 * Extra props of the treeList's Tree. Transfer owns its value and data: its flat item map reads the fixed field names,
 * so `keyMaps` and the other data shapes are dropped along with `modelValue` and change listeners
 */
export type TransferTreeProps = Omit<TreeProps, 'modelValue' | 'defaultValue' | 'keyMaps' | 'treeData' | 'treeDataSimpleJson' | 'changeWithObject'> & {
    class?: unknown;
    style?: StyleValue;
    [key: `on${string}` | `aria-${string}` | `data-${string}`]: unknown;
};

export interface TransferProps {
    modelValue?: TransferValue;
    defaultValue?: TransferValue;
    dataSource?: TransferDataSource;
    type?: TransferType;
    disabled?: boolean;
    draggable?: boolean;
    loading?: boolean;
    /** treeList only: the selected items show their path from the root */
    showPath?: boolean;
    /** false hides the search box; a function replaces the default case-insensitive label match */
    filter?: boolean | ((searchValue: string, item: TransferDataItem) => boolean);
    inputProps?: TransferInputProps;
    /** treeList only; of the Tree's slots only `#label` is forwarded */
    treeProps?: TransferTreeProps;
    /** Pages the left list */
    pagination?: TransferPagination;
    /** Renders the selected list virtually; ignored while `draggable` */
    virtualize?: TransferVirtualize;
}

export interface TransferEmits {
    'update:modelValue': [values: TransferValue];
    change: [values: TransferValue, items: TransferDataItem[]];
    select: [item: TransferDataItem];
    deselect: [item: TransferDataItem];
    /** Typing in the search box; the `search` method does not fire it */
    search: [searchValue: string];
}

export interface TransferHandle {
    /** Searches as if `value` were typed into the search box, without firing `search` */
    search: (value: string) => void;
}

export interface TransferLabelSlotProps {
    item: TransferDataItem;
}

export interface TransferSourceItemSlotProps {
    item: TransferDataItem;
    /** Position in the shown (filtered and paged) items, not in the dataSource */
    index: number;
    checked: boolean;
    onChange: () => void;
}

export interface TransferSelectedItemSlotProps {
    item: TransferDataItem;
    index: number;
    fullPath?: TransferDataItem[];
    onRemove: () => void;
    /** With `draggable`: wrap the drag icon in it, `<component :is="handle"><IconHandle /></component>` */
    handle?: Component;
}

export interface TransferSourceHeaderSlotProps {
    num: number;
    showButton: boolean;
    allChecked: boolean;
    onAllClick: () => void;
    /** treeList only: the number of leaves among the shown nodes */
    leafOnlyNum?: number;
}

export interface TransferSelectedHeaderSlotProps {
    num: number;
    showButton: boolean;
    onClear: () => void;
}

export interface TransferSourcePanelSlotProps {
    /** The values of the selected items */
    value: TransferValue;
    loading: boolean | undefined;
    /** Whether a search is on and matches nothing */
    noMatch: boolean;
    /** The items that match the search */
    filterData: TransferDataItem[];
    sourceData: TransferDataItem[];
    propsDataSource: TransferDataSource;
    allChecked: boolean;
    showNumber: number;
    inputValue: string;
    selectedItems: Map<string | number, TransferDataItem>;
    onSearch: (searchString: string) => void;
    /** Selects every shown item, or clears them when all are selected */
    onAllClick: () => void;
    onSelectOrRemove: (item: TransferDataItem) => void;
    /** Replaces the selection with the items of these values */
    onSelect: (values: TransferValue) => void;
}

export interface TransferSelectedPanelSlotProps {
    length: number;
    selectedData: TransferDataItem[];
    onClear: () => void;
    onRemove: (item: TransferDataItem) => void;
    onSortEnd: TransferOnSortEnd;
}

export interface TransferSlots {
    /** Content of an item in both lists; the dataSource label is the default */
    label?: (props: TransferLabelSlotProps) => VNode[];
    sourceItem?: (props: TransferSourceItemSlotProps) => VNode[];
    selectedItem?: (props: TransferSelectedItemSlotProps) => VNode[];
    sourceHeader?: (props: TransferSourceHeaderSlotProps) => VNode[];
    selectedHeader?: (props: TransferSelectedHeaderSlotProps) => VNode[];
    sourcePanel?: (props: TransferSourcePanelSlotProps) => VNode[];
    selectedPanel?: (props: TransferSelectedPanelSlotProps) => VNode[];
    /** No data; an empty slot hides the empty state */
    emptyLeft?: () => VNode[];
    /** Nothing selected; an empty slot hides the empty state */
    emptyRight?: () => VNode[];
    /** The search matches nothing; an empty slot hides the empty state */
    emptySearch?: () => VNode[];
}
