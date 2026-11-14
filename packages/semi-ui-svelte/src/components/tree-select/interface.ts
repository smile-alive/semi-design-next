import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { TreeSelectPart } from '@fibrae/semi-foundation/components/tree-select/constants';
import type { CheckRelation, ExpandAction } from '@fibrae/semi-foundation/components/tree/foundation';
import type { Size } from '@fibrae/semi-foundation/utils';
import type { ValidateStatus } from '../input/index.js';
import type { PopoverProps } from '../popover/index.js';
import type { TagCloseEvent } from '../tag/index.js';
import type { Position } from '../tooltip/index.js';
import type { TreeExpandIconSnippetProps, TreeFullLabelSnippetProps, TreeIconSnippetProps, TreeKeyMapProps, TreeLabelSnippetProps, TreeNodeData, TreeSearchSnippetProps, TreeVirtualize } from '../tree/index.js';

export type TreeSelectSize = Size;
export type TreeSelectSearchPosition = 'dropdown' | 'trigger';
export type TreeSelectExpandAction = ExpandAction;
export type TreeSelectKeyMapProps = TreeKeyMapProps;

/** A node value, or the node itself with `onChangeWithObject` */
export type TreeSelectNodeValue = string | number | TreeNodeData;

/** The selected value, or in multiple mode the checked values; `undefined` once a single selection is cleared */
export type TreeSelectValue = TreeSelectNodeValue | TreeSelectNodeValue[];

/** The click or key that selects, `null` for a tag removed or a snippet function called without an event */
export type TreeSelectChangeEvent = MouseEvent | KeyboardEvent | null;

export interface TreeSelectSelectedItemSnippetProps {
    item: TreeNodeData;
    index: number;
    disabled: boolean;
    /**
     * Removes the tag, or clears the single selection; a given event has its default prevented, so a Tag wired to
     * it does not hide itself
     */
    onClose: (event?: TagCloseEvent) => void;
}

export interface TreeSelectTriggerSnippetProps {
    value: TreeNodeData[];
    inputValue: string;
    placeholder?: string;
    disabled: boolean;
    componentProps: TreeSelectProps;
    onSearch: (inputValue: string) => void;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the dropdown */
    onClear: (event?: MouseEvent) => void;
    onRemove: (key: string) => void;
}

/**
 * What the search box receives, ready to spread on a Semi Input. The TreeSelect finds the text field inside the snippet
 * itself to focus it, so no ref is handed over.
 */
export interface TreeSelectSearchSnippetProps extends TreeSearchSnippetProps {
    preventScroll?: boolean;
    /** The trigger search box: `searchAutoFocus` */
    autofocus?: boolean;
    disabled?: boolean;
    /** The trigger search box: the TreeSelect's resolved size */
    size?: TreeSelectSize;
    role?: 'combobox';
    'aria-activedescendant'?: string;
    'aria-autocomplete': 'list';
    'aria-controls': string;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'tree';
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-errormessage'?: string;
    'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
    'aria-required'?: boolean | 'true' | 'false';
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
}

// The trigger is the landing element; its lowercase listeners that share a meaning with a callback below give way to it
type NativeKeys = 'children' | 'prefix' | 'placeholder' | 'onchange' | 'onselect' | 'onload' | 'onfocus' | 'onblur';

export interface TreeSelectProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys> {
    /** Bindable; leave it out for an uncontrolled TreeSelect. `bind:value={get, set}` makes it fully controlled */
    value?: TreeSelectValue;
    multiple?: boolean;
    /** Only a new array updates the options: changes made in place are not seen */
    treeData?: TreeNodeData[];
    keyMaps?: TreeSelectKeyMapProps;
    treeNodeLabelProp?: string;

    treeNodeFilterProp?: string;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean);
    showFilteredOnly?: boolean;
    searchPosition?: TreeSelectSearchPosition;
    searchPlaceholder?: string;
    searchAutoFocus?: boolean;
    showSearchClear?: boolean;
    remote?: boolean;

    expandAll?: boolean;
    defaultExpandAll?: boolean;
    /** Bindable, like `value` */
    expandedKeys?: string[];
    autoExpandParent?: boolean;
    expandAction?: TreeSelectExpandAction;
    motionExpand?: boolean;
    /** Loads a node's children; a node without `isLeaf` shows the expand arrow while it is set */
    loadData?: (data: TreeNodeData) => Promise<void>;
    /** Bindable, like `value` */
    loadedKeys?: string[];
    leafOnly?: boolean;
    checkRelation?: CheckRelation;
    disableStrictly?: boolean;
    autoMergeValue?: boolean;
    /** `value` and `onChange` carry the nodes instead of their values */
    onChangeWithObject?: boolean;

    maxTagCount?: number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: PopoverProps;
    /** On by default for a virtualized list */
    labelEllipsis?: boolean;
    showLine?: boolean;
    virtualize?: TreeVirtualize;
    placeholder?: string;
    disabled?: boolean;
    size?: TreeSelectSize;
    borderless?: boolean;
    validateStatus?: ValidateStatus;
    /** The id of the element around the `insetLabel` snippet */
    insetLabelId?: string;
    showClear?: boolean;

    /** Closes the dropdown once a node is selected in single mode */
    clickToHide?: boolean;
    clickTriggerToHide?: boolean;
    /** Opens the dropdown on mount; TreeSelect has no controlled open state */
    defaultOpen?: boolean;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    stopPropagation?: boolean | string;
    classNames?: Partial<Record<TreeSelectPart, ClassValue>>;
    styles?: Partial<Record<TreeSelectPart, string>>;
    dropdownMatchSelectWidth?: boolean;
    preventScroll?: boolean;
    triggerTagWrap?: boolean;

    /** With `onChangeWithObject` the value and the node are both the node */
    onChange?: (value: TreeSelectValue | undefined, node: TreeNodeData | TreeNodeData[] | undefined, event: TreeSelectChangeEvent) => void;
    onExpand?: (expandedKeys: string[], info: { expanded: boolean; node: TreeNodeData }) => void;
    onLoad?: (loadedKeys: Set<string>, node: TreeNodeData) => void;
    onSelect?: (selectedKey: string, selected: boolean, node: TreeNodeData) => void;
    onSearch?: (input: string, filteredExpandedKeys: string[], filteredNodes: TreeNodeData[]) => void;
    onVisibleChange?: (visible: boolean) => void;
    /**
     * Focus entering the trigger or the dropdown from outside (the focusin); moving within them does not fire it again.
     * A click or key that reopens after a pick closed it fires it too, `null` for `searchAutoFocus` on mount
     */
    onFocus?: (event: MouseEvent | KeyboardEvent | FocusEvent | null) => void;
    /**
     * Once per `onFocus`: the mousedown outside, the click or key that selects and closes, or the focusout that leaves
     * the trigger and the dropdown
     */
    onBlur?: (event: MouseEvent | KeyboardEvent | FocusEvent) => void;
    onClear?: (event: TreeSelectChangeEvent) => void;

    label?: Snippet<[TreeLabelSnippetProps]>;
    icon?: Snippet<[TreeIconSnippetProps]>;
    /** A single element gets the class and the click that expands */
    expandIcon?: Snippet<[TreeExpandIconSnippetProps]>;
    /** Content of a whole row; the row element carrying the id, role and state wraps it */
    fullLabel?: Snippet<[TreeFullLabelSnippetProps]>;
    /** The single selection, or the content of a built-in tag */
    selectedItem?: Snippet<[TreeSelectSelectedItemSnippetProps]>;
    /** Replaces each tag in multiple mode, ahead of `selectedItem` */
    tag?: Snippet<[TreeSelectSelectedItemSnippetProps]>;
    trigger?: Snippet<[TreeSelectTriggerSnippetProps]>;
    /** Replaces the search box; `false` hides it while `filterTreeNode` still filters */
    search?: Snippet<[TreeSelectSearchSnippetProps]> | false;
    prefix?: Snippet;
    suffix?: Snippet;
    insetLabel?: Snippet;
    /** `null` hides the arrow */
    arrowIcon?: Snippet | null;
    clearIcon?: Snippet;
    /** `null` hides the empty state */
    emptyContent?: Snippet | null;
    /** Above the tree; it takes the place of the dropdown search box */
    outerTopSlot?: Snippet;
    outerBottomSlot?: Snippet;
}

/** The methods on a TreeSelect instance from `bind:this` */
export interface TreeSelectHandle {
    /** Searches as if `value` were typed, opening the dropdown first; needs `filterTreeNode` */
    search: (value: string) => void;
    close: () => void;
}
