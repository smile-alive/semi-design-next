import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { InputProps } from '../input/interface.js';
import type { TreeProps } from '../tree/interface.js';

export type TransferType = 'list' | 'groupList' | 'treeList';

export type TransferValue = Array<string | number>;

/** An entry of the dataSource; extra fields reach the snippets and callbacks unchanged */
export interface TransferDataItem {
    [key: string]: unknown;
    key: string | number;
    value?: string | number;
    /** The default filter matches it; render other content with the `label` snippet */
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

/** Extra props of the search Input; Transfer owns its value and change callback */
export type TransferInputProps = Omit<InputProps, 'value' | 'onChange' | 'children'>;

/**
 * Extra props of the treeList's Tree. Transfer owns its value and data: its flat item map reads the fixed field names,
 * so `keyMaps` and the other data shapes are dropped along with `value` and the change callbacks. It also owns the
 * search box (hidden) and the `label` snippet, which forwards Transfer's own.
 */
export type TransferTreeProps = Omit<TreeProps, 'value' | 'onChange' | 'keyMaps' | 'treeData' | 'treeDataSimpleJson' | 'onChangeWithObject' | 'search' | 'label' | 'children'>;

// The lowercase native listeners of the same names as the callbacks below stay off the props
type NativeKeys = 'onchange' | 'onselect' | 'children';

export interface TransferProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys> {
    /** Bindable; leave it out for an uncontrolled transfer. `bind:value={get, set}` makes it fully controlled */
    value?: TransferValue;
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
    /** treeList only; of the Tree's snippets only `label` is forwarded */
    treeProps?: TransferTreeProps;
    /** Pages the left list */
    pagination?: TransferPagination;
    /** Renders the selected list virtually; ignored while `draggable` */
    virtualize?: TransferVirtualize;
    onChange?: (values: TransferValue, items: TransferDataItem[]) => void;
    onSelect?: (item: TransferDataItem) => void;
    onDeselect?: (item: TransferDataItem) => void;
    /** Typing in the search box; the `search` method does not fire it */
    onSearch?: (searchValue: string) => void;
    /** The focus moved from inside the transfer to somewhere outside it; moves between its own controls do not fire it */
    onBlur?: (event: FocusEvent) => void;
    /** Content of an item in both lists; the dataSource label is the default */
    label?: Snippet<[TransferLabelSnippetProps]>;
    sourceItem?: Snippet<[TransferSourceItemSnippetProps]>;
    selectedItem?: Snippet<[TransferSelectedItemSnippetProps]>;
    sourceHeader?: Snippet<[TransferSourceHeaderSnippetProps]>;
    selectedHeader?: Snippet<[TransferSelectedHeaderSnippetProps]>;
    sourcePanel?: Snippet<[TransferSourcePanelSnippetProps]>;
    selectedPanel?: Snippet<[TransferSelectedPanelSnippetProps]>;
    /** No data; `false` hides the empty state */
    emptyLeft?: Snippet | false;
    /** Nothing selected; `false` hides the empty state */
    emptyRight?: Snippet | false;
    /** The search matches nothing; `false` hides the empty state */
    emptySearch?: Snippet | false;
}

/** The methods on a Transfer instance from `bind:this` */
export interface TransferHandle {
    /** Searches as if `value` were typed into the search box, without firing `onSearch` */
    search: (value: string) => void;
}

export interface TransferLabelSnippetProps {
    item: TransferDataItem;
}

export interface TransferSourceItemSnippetProps {
    item: TransferDataItem;
    /** Position in the shown (filtered and paged) items, not in the dataSource */
    index: number;
    checked: boolean;
    onChange: () => void;
}

export interface TransferSelectedItemSnippetProps {
    item: TransferDataItem;
    index: number;
    fullPath?: TransferDataItem[];
    onRemove: () => void;
    /** With `draggable`: wrap the drag icon in it, `{@render handle?.(grip)}` with `grip` a snippet of the icon */
    handle?: Snippet<[Snippet]>;
}

export interface TransferSourceHeaderSnippetProps {
    num: number;
    showButton: boolean;
    allChecked: boolean;
    onAllClick: () => void;
    /** treeList only: the number of leaves among the shown nodes */
    leafOnlyNum?: number;
}

export interface TransferSelectedHeaderSnippetProps {
    num: number;
    showButton: boolean;
    onClear: () => void;
}

export interface TransferSourcePanelSnippetProps {
    /** The values of the selected items */
    value: TransferValue;
    loading?: boolean;
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

export interface TransferSelectedPanelSnippetProps {
    length: number;
    selectedData: TransferDataItem[];
    onClear: () => void;
    onRemove: (item: TransferDataItem) => void;
    onSortEnd: TransferOnSortEnd;
}
