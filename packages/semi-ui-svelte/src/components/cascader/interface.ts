import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { BasicCascaderData, BasicEntity, BasicScrollPanelProps, KeyMapProps, Virtualize } from '@fibrae/semi-foundation/components/cascader/foundation';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { CheckboxEvent } from '../checkbox/index.js';
import type { ValidateStatus } from '../input/index.js';
import type { PopoverProps } from '../popover/index.js';
import type { TagCloseEvent } from '../tag/index.js';
import type { Position } from '../tooltip/index.js';

export type CascaderKeyMapProps = KeyMapProps;
export type CascaderSize = Size;
export type CascaderVirtualize = Virtualize;

export interface CascaderData extends BasicCascaderData {
    label: string | number;
    children?: CascaderData[];
}

export interface CascaderEntity extends BasicEntity {
    children?: CascaderEntity[];
    data: CascaderData;
    parent?: CascaderEntity;
}

export interface CascaderScrollPanelProps extends BasicScrollPanelProps {
    activeNode: CascaderData;
}

export type CascaderSimpleValue = string | number | CascaderData;

/** A single-mode value is one node or its path; a multiple-mode value may also be a list of paths */
export type CascaderValue = CascaderSimpleValue | CascaderSimpleValue[] | CascaderSimpleValue[][];

/** The selected path, or in multiple mode the checked paths; their nodes with `onChangeWithObject` */
export type CascaderChangeValue = CascaderSimpleValue[] | CascaderSimpleValue[][];

export interface CascaderLabelSnippetProps {
    item: CascaderData;
}

export interface CascaderDisplaySnippetProps {
    labels: Array<string | number>;
    /**
     * The nodes on the selected path; a value not found in `treeData` gives its raw values instead, as `onChange`
     * does with `onChangeWithObject`
     */
    path: CascaderSimpleValue[];
}

export interface CascaderTagSnippetProps {
    entity: CascaderEntity;
    index: number;
    disabled: boolean;
    /** Unchecks the node; a given event has its default prevented, so a Tag wired to it does not hide itself */
    onClose: (event?: TagCloseEvent) => void;
}

export interface CascaderFilterItemDomProps {
    id: string;
    role: 'option';
    'aria-selected': boolean;
    'aria-disabled'?: true;
    class: ClassValue;
    style?: string;
    onclick: (event: MouseEvent) => void;
}

export interface CascaderFilterItemSnippetProps {
    props: CascaderFilterItemDomProps;
    inputValue: string;
    disabled: boolean;
    data: CascaderData[];
    checkStatus: {
        checked: boolean;
        halfChecked: boolean;
    };
    selected: boolean;
    onCheck: (event: CheckboxEvent) => void;
}

export interface CascaderTriggerSnippetProps {
    /** The position in treeData (such as `0-0-1`) of the selected node, or in multiple mode of each checked node */
    value?: string | Set<string>;
    inputValue: string;
    placeholder?: string;
    disabled: boolean;
    onSearch: (inputValue: string) => void;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the dropdown */
    onClear: (event?: MouseEvent) => void;
    onRemove: (pos: string) => void;
}

// The trigger is the landing element; its lowercase listeners that share a meaning with a callback below give way to it
type NativeKeys = 'children' | 'prefix' | 'placeholder' | 'onchange' | 'onselect' | 'onfocus' | 'onblur' | 'onkeydown';

export interface CascaderProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys> {
    /** Bindable; leave it out for an uncontrolled Cascader. `bind:value={get, set}` makes it fully controlled */
    value?: CascaderValue;
    multiple?: boolean;
    treeData?: CascaderData[];
    keyMaps?: CascaderKeyMapProps;
    changeOnSelect?: boolean;
    /** Not followed when it changes after mount */
    autoMergeValue?: boolean;
    leafOnly?: boolean;
    checkRelation?: 'related' | 'unRelated';
    disableStrictly?: boolean;
    max?: number;
    maxTagCount?: number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: Omit<PopoverProps, 'children' | 'child' | 'content'>;
    enableLeafClick?: boolean;
    clickToSelect?: boolean;
    showNext?: 'click' | 'hover';
    /** Loads the children of the last node; a node without `isLeaf` shows the expand arrow while it is set */
    loadData?: (selectOptions: CascaderData[]) => Promise<void>;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: CascaderData) => boolean);
    filterSorter?: (first: CascaderData[], second: CascaderData[], inputValue: string) => number;
    filterLeafOnly?: boolean;
    treeNodeFilterProp?: string;
    remote?: boolean;
    displayProp?: string;
    separator?: string;
    /** `onChange` and `value` carry the nodes of each path instead of their values */
    onChangeWithObject?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    searchPosition?: 'trigger' | 'custom';
    disabled?: boolean;
    size?: CascaderSize;
    borderless?: boolean;
    validateStatus?: ValidateStatus;
    insetLabelId?: string;
    showClear?: boolean;
    /** Opens the dropdown on mount; Cascader has no controlled open state */
    defaultOpen?: boolean;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    stopPropagation?: boolean | string;
    dropdownClassName?: string;
    dropdownStyle?: string;
    preventScroll?: boolean;
    virtualizeInSearch?: CascaderVirtualize;
    onChange?: (value: CascaderChangeValue) => void;
    /** In multiple mode a single checked node gives its value, more give an array */
    onSelect?: (value: string | number | Array<string | number>) => void;
    onSearch?: (value: string) => void;
    /** Focus entering the trigger or the dropdown from outside passes the `focusin` event; moving within them does not report again. A click or key that reopens after a pick closed it reports it too */
    onFocus?: (event: MouseEvent | KeyboardEvent | FocusEvent) => void;
    /** Once per focus: the mousedown outside, the click or key that picks and closes, or the `focusout` that leaves the trigger and the dropdown */
    onBlur?: (event?: MouseEvent | KeyboardEvent | FocusEvent) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
    onClear?: () => void;
    onExceed?: (checkedItem: CascaderEntity[]) => void;
    onLoad?: (newLoadedKeys: Set<string>, data: CascaderData) => void;
    /** Scrolling a column of the tree; the search results do not report it */
    onListScroll?: (event: Event, panel: CascaderScrollPanelProps) => void;
    /**
     * Before the Cascader handles the key; `preventDefault` does not stop it. Keys other than those on an inner control
     * (the clear button, a custom trigger's control) are reported in the capture phase on the trigger, so
     * `stopPropagation` there skips the search input and the trigger's own handling of the open and close keys; the
     * options still take the key
     */
    onKeyDown?: (event: KeyboardEvent) => void;
    label?: Snippet<[CascaderLabelSnippetProps]>;
    display?: Snippet<[CascaderDisplaySnippetProps]>;
    tag?: Snippet<[CascaderTagSnippetProps]>;
    filterItem?: Snippet<[CascaderFilterItemSnippetProps]>;
    trigger?: Snippet<[CascaderTriggerSnippetProps]>;
    expandIcon?: Snippet;
    /** `null` hides the arrow */
    arrowIcon?: Snippet | null;
    clearIcon?: Snippet;
    emptyContent?: Snippet | null;
    prefix?: Snippet;
    suffix?: Snippet;
    insetLabel?: Snippet;
    topSlot?: Snippet;
    bottomSlot?: Snippet;
}
