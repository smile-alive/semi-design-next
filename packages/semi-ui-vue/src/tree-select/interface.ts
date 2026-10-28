import type { ComponentPublicInstance, StyleValue, VNode } from 'vue';
import type { CheckRelation, ExpandAction } from '@fibrae/semi-foundation/tree/foundation';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { ValidateStatus } from '../input/interface';
import type { PopoverProps } from '../popover/interface';
import type { TagCloseEvent } from '../tag/interface';
import type { Position } from '../tooltip/interface';
import type { TreeExpandIconSlotProps, TreeFullLabelSlotProps, TreeIconSlotProps, TreeKeyMapProps, TreeLabelSlotProps, TreeNodeData, TreeSearchSlotProps, TreeVirtualize } from '../tree/interface';

/**
 * `true extends Multiple` rather than `Multiple extends true`: the outer conditional distributes, so a `boolean`
 * multiple gives both shapes
 */
type ByMultiple<Multiple, Single, Many> = Multiple extends unknown ? (true extends Multiple ? Many : Single) : never;

export type TreeSelectSize = Size;
export type TreeSelectSearchPosition = 'dropdown' | 'trigger';
export type TreeSelectExpandAction = ExpandAction;
export type TreeSelectKeyMapProps = TreeKeyMapProps;

/** A node value, or the node itself with `changeWithObject` */
export type TreeSelectValue = string | number | TreeNodeData;

/** The selected value, `undefined` once cleared; in multiple mode the checked values */
export type TreeSelectChangeValue<T, Multiple> = ByMultiple<Multiple, T | undefined, T[]>;

/** The node of the selected value, or in multiple mode the checked nodes */
export type TreeSelectChangeNode<Multiple> = ByMultiple<Multiple, TreeNodeData | undefined, TreeNodeData[]>;

/**
 * `T` is the type of the values the caller stores and `Multiple` follows the `multiple` prop, so that `modelValue`,
 * `change` and the `trigger` slot take the shapes of the mode in use
 */
export interface TreeSelectProps<T = TreeSelectValue, Multiple extends boolean | undefined = undefined> {
    modelValue?: TreeSelectChangeValue<T, Multiple>;
    defaultValue?: TreeSelectChangeValue<T, Multiple>;
    multiple?: Multiple;
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
    defaultExpandedKeys?: string[];
    expandedKeys?: string[];
    autoExpandParent?: boolean;
    expandAction?: TreeSelectExpandAction;
    motionExpand?: boolean;
    /** Loads a node's children; a node without `isLeaf` shows the expand arrow while it is set */
    loadData?: (data: TreeNodeData) => Promise<void>;
    loadedKeys?: string[];
    leafOnly?: boolean;
    checkRelation?: CheckRelation;
    disableStrictly?: boolean;
    autoMergeValue?: boolean;
    /** `modelValue` and `change` carry the nodes instead of their values; named without the `on` prefix, which Vue reads as a listener */
    changeWithObject?: boolean;

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
    /** The id of the element around the `insetLabel` slot */
    insetLabelId?: string;
    showClear?: boolean;

    /** Closes the dropdown once a node is selected in single mode */
    clickToHide?: boolean;
    clickTriggerToHide?: boolean;
    defaultOpen?: boolean;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    stopPropagation?: boolean | string;
    dropdownClassName?: string;
    dropdownStyle?: StyleValue;
    dropdownMatchSelectWidth?: boolean;
    /** Goes on the `role="tree"` element */
    optionListStyle?: StyleValue;
    preventScroll?: boolean;
    /** Lets the tags of a multiple trigger search wrap onto more lines */
    triggerTagWrap?: boolean;
}

/** The click or key that selects, `null` for a tag removed or a slot function called without an event */
export type TreeSelectChangeEvent = MouseEvent | KeyboardEvent | null;

export interface TreeSelectEmits<T = TreeSelectValue, Multiple extends boolean | undefined = undefined> {
    'update:modelValue': [value: TreeSelectChangeValue<T, Multiple>];
    /** With `changeWithObject` the value and the node are both the node */
    change: [value: TreeSelectChangeValue<T, Multiple>, node: TreeSelectChangeNode<Multiple>, event: TreeSelectChangeEvent];
    'update:expandedKeys': [expandedKeys: string[]];
    expand: [expandedKeys: string[], info: { expanded: boolean; node: TreeNodeData }];
    'update:loadedKeys': [loadedKeys: string[]];
    load: [loadedKeys: Set<string>, node: TreeNodeData];
    select: [selectedKey: string, selected: boolean, node: TreeNodeData];
    search: [input: string, filteredExpandedKeys: string[], filteredNodes: TreeNodeData[]];
    dropdownVisibleChange: [visible: boolean];
    /**
     * Focus entering the trigger or the dropdown from outside (the focusin); moving within them does not emit again. A
     * click or key that reopens after a pick closed it emits it too, `null` for `searchAutoFocus` on mount
     */
    focus: [event: MouseEvent | KeyboardEvent | FocusEvent | null];
    /**
     * Once per `focus`: the mousedown outside, the click or key that selects and closes, or the focusout that leaves
     * the trigger and the dropdown
     */
    blur: [event: MouseEvent | KeyboardEvent | FocusEvent];
    clear: [event: TreeSelectChangeEvent];
    /** Before the TreeSelect handles the key */
    keydown: [event: KeyboardEvent];
}

export interface TreeSelectSelectedItemSlotProps {
    item: TreeNodeData;
    index: number;
    disabled: boolean;
    /**
     * Removes the tag, or clears the single selection; a given event has its default prevented, so a Tag wired to
     * it does not hide itself
     */
    onClose: (event?: TagCloseEvent) => void;
}

export interface TreeSelectTriggerSlotProps<T = TreeSelectValue, Multiple extends boolean | undefined = undefined> {
    /** The selected nodes */
    value: TreeNodeData[];
    inputValue: string;
    placeholder?: string;
    disabled: boolean;
    /** The TreeSelect's props */
    componentProps: TreeSelectProps<T, Multiple>;
    /** Updates the search keyword */
    onSearch: (inputValue: string) => void;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the dropdown */
    onClear: (event?: MouseEvent) => void;
    /** Unchecks the node with the key */
    onRemove: (key: string) => void;
}

/**
 * What the search box receives, ready for `v-bind` on a Semi Input. `inputRef` must be bound to it, so the TreeSelect
 * can focus it.
 */
export interface TreeSelectSearchSlotProps extends TreeSearchSlotProps {
    inputRef: (element: Element | ComponentPublicInstance | null) => void;
    preventScroll?: boolean;
    /** The trigger search box: `searchAutoFocus` */
    autofocus?: boolean;
    disabled?: boolean;
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

export interface TreeSelectSlots<T = TreeSelectValue, Multiple extends boolean | undefined = undefined> {
    /** Content of a row's label */
    label?: (props: TreeLabelSlotProps) => VNode[];
    /** A row's icon */
    icon?: (props: TreeIconSlotProps) => VNode[];
    /** A single element gets the class and the click that expands */
    expandIcon?: (props: TreeExpandIconSlotProps) => VNode[];
    /** Content of a whole row; the row element carrying the id, role and state wraps it */
    fullLabel?: (props: TreeFullLabelSlotProps) => VNode[];
    /**
     * The single selection, or the content of a built-in tag; empty content shows the placeholder, or leaves the tag
     * out
     */
    selectedItem?: (props: TreeSelectSelectedItemSlotProps) => VNode[];
    /** Replaces each tag in multiple mode, ahead of `selectedItem`; empty content leaves the tag out */
    tag?: (props: TreeSelectSelectedItemSlotProps) => VNode[];
    /** Replaces the trigger content */
    trigger?: (props: TreeSelectTriggerSlotProps<T, Multiple>) => VNode[];
    /** Replaces the search box; an empty slot hides it */
    search?: (props: TreeSelectSearchSlotProps) => VNode[];
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    insetLabel?: () => VNode[];
    /** An empty slot hides the arrow */
    arrowIcon?: () => VNode[];
    /** Empty content keeps the default icon */
    clearIcon?: () => VNode[];
    /** An empty slot hides the empty state */
    emptyContent?: () => VNode[];
    /** Above the tree; it takes the place of the dropdown search box */
    outerTopSlot?: () => VNode[];
    outerBottomSlot?: () => VNode[];
}

/** The methods on a TreeSelect ref */
export interface TreeSelectHandle {
    /** Searches as if `value` were typed, opening the dropdown first; needs `filterTreeNode` */
    search: (value: string) => void;
    /** Closes the dropdown */
    close: () => void;
}
