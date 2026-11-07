import type { ClassValue, StyleValue, VNode } from 'vue';
import type { BasicCascaderData, BasicEntity, BasicScrollPanelProps, KeyMapProps, Virtualize } from '@fibrae/semi-foundation/components/cascader/foundation';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { CheckboxEvent } from '../checkbox/interface';
import type { ValidateStatus } from '../input/interface';
import type { PopoverProps } from '../popover/interface';
import type { TagCloseEvent } from '../tag/interface';
import type { Position } from '../tooltip/interface';

/**
 * `true extends Multiple` rather than `Multiple extends true`: the outer conditional distributes, so a `boolean`
 * multiple gives both shapes
 */
type ByMultiple<Multiple, Single, Many> = Multiple extends unknown ? (true extends Multiple ? Many : Single) : never;

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

export type CascaderValue = CascaderSimpleValue | CascaderSimpleValue[] | CascaderSimpleValue[][];

type ModeValue<Multiple> = ByMultiple<Multiple, CascaderSimpleValue | CascaderSimpleValue[], CascaderValue>;

export type CascaderChangeValue<Multiple> = ByMultiple<Multiple, CascaderSimpleValue[], CascaderSimpleValue[][]>;

/**
 * `Multiple` follows the `multiple` prop, so that `modelValue`, `change` and the `trigger` slot take the shapes of the
 * mode in use
 */
export interface CascaderProps<Multiple extends boolean | undefined = undefined> {
    modelValue?: ModeValue<Multiple>;
    defaultValue?: ModeValue<Multiple>;
    multiple?: Multiple;
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
    restTagsPopoverProps?: PopoverProps;
    enableLeafClick?: boolean;
    clickToSelect?: boolean;
    showNext?: 'click' | 'hover';
    /** Loads the children of the last node; a node without `isLeaf` shows the expand arrow while it is set */
    loadData?: (selectOptions: CascaderData[]) => Promise<void>;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: CascaderData) => boolean);
    /** `first` and `second` are the two result paths, from the root to the matched node */
    filterSorter?: (first: CascaderData[], second: CascaderData[], inputValue: string) => number;
    filterLeafOnly?: boolean;
    treeNodeFilterProp?: string;
    remote?: boolean;
    displayProp?: string;
    separator?: string;
    /** `change` reports the nodes of each path instead of their values; named without the `on` prefix, which Vue reads as a listener */
    changeWithObject?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    searchPosition?: 'trigger' | 'custom';
    disabled?: boolean;
    size?: CascaderSize;
    borderless?: boolean;
    validateStatus?: ValidateStatus;
    insetLabelId?: string;
    showClear?: boolean;
    defaultOpen?: boolean;
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    position?: Position;
    stopPropagation?: boolean | string;
    dropdownClassName?: string;
    dropdownStyle?: StyleValue;
    preventScroll?: boolean;
    virtualizeInSearch?: CascaderVirtualize;
}

export interface CascaderEmits<Multiple extends boolean | undefined = undefined> {
    'update:modelValue': [value: CascaderChangeValue<Multiple>];
    change: [value: CascaderChangeValue<Multiple>];
    /** In multiple mode a single checked node gives its value, more give an array */
    select: [value: ByMultiple<Multiple, string | number, string | number | Array<string | number>>];
    search: [value: string];
    /**
     * Focus entering the trigger or the dropdown from outside passes the `focusin` event; moving within them does not
     * report again. A click or key that reopens after a pick closed it reports it too
     */
    focus: [event: MouseEvent | KeyboardEvent | FocusEvent];
    /**
     * Once per focus: the mousedown outside, the click or key that picks and closes, or the `focusout` that leaves the
     * trigger and the dropdown
     */
    blur: [event?: MouseEvent | KeyboardEvent | FocusEvent];
    dropdownVisibleChange: [visible: boolean];
    clear: [];
    exceed: [checkedItem: CascaderEntity[]];
    load: [newLoadedKeys: Set<string>, data: CascaderData];
    /** Scrolling a column of the tree; the search results do not report it */
    listScroll: [event: Event, panel: CascaderScrollPanelProps];
    /**
     * Before the Cascader handles the key; `preventDefault` does not stop it. Keys other than those on an inner control
     * (the clear button, a custom trigger's control) are emitted in the capture phase on the trigger, so
     * `stopPropagation` there skips the search input and the trigger's own handling of the open and close keys; the
     * options still take the key
     */
    keydown: [event: KeyboardEvent];
}

export interface CascaderLabelSlotProps {
    item: CascaderData;
}

export interface CascaderDisplaySlotProps {
    labels: Array<string | number>;
    /**
     * The nodes on the selected path; a value not found in `treeData` gives its raw values instead, as `change` does
     * with `changeWithObject`
     */
    path: CascaderSimpleValue[];
}

export interface CascaderTagSlotProps {
    entity: CascaderEntity;
    index: number;
    disabled: boolean;
    /** Unchecks the node; a given event has its default prevented, so a Tag wired to it does not hide itself */
    onClose: (event?: TagCloseEvent) => void;
}

export interface CascaderFilterItemSlotProps {
    class: ClassValue;
    inputValue: string;
    disabled: boolean;
    data: CascaderData[];
    checkStatus: {
        checked: boolean;
        halfChecked: boolean;
    };
    selected: boolean;
    onClick: (event: MouseEvent) => void;
    /** For the `change` event of a Checkbox in the row */
    onCheck: (event: CheckboxEvent) => void;
}

export interface CascaderTriggerSlotProps<Multiple extends boolean | undefined = undefined> {
    /** The position in treeData (such as `0-0-1`) of the selected node, or in multiple mode of each checked node */
    value: ByMultiple<Multiple, string | undefined, Set<string>>;
    /** The search keyword; the selected path's text while closed in single mode */
    inputValue: string;
    placeholder?: string;
    disabled: boolean;
    componentProps: CascaderProps<Multiple>;
    onSearch: (inputValue: string) => void;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the dropdown */
    onClear: (event?: MouseEvent) => void;
    onRemove: (pos: string) => void;
}

export interface CascaderSlots<Multiple extends boolean | undefined = undefined> {
    label?: (props: CascaderLabelSlotProps) => VNode[];
    /** The selection in single mode; empty content shows the placeholder */
    display?: (props: CascaderDisplaySlotProps) => VNode[];
    tag?: (props: CascaderTagSlotProps) => VNode[];
    /** Replaces a row of the search results; a single element root gets the option's id, role and state */
    filterItem?: (props: CascaderFilterItemSlotProps) => VNode[];
    trigger?: (props: CascaderTriggerSlotProps<Multiple>) => VNode[];
    /** Empty content keeps the default icon */
    expandIcon?: () => VNode[];
    /** An empty slot hides the arrow */
    arrowIcon?: () => VNode[];
    /** Empty content keeps the default icon */
    clearIcon?: () => VNode[];
    /** An empty slot hides the empty state */
    emptyContent?: () => VNode[];
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    insetLabel?: () => VNode[];
    topSlot?: () => VNode[];
    bottomSlot?: () => VNode[];
}

export interface CascaderHandle {
    open: () => void;
    close: () => void;
    focus: () => void;
    blur: () => void;
    /** Searches as if `value` were typed; needs `filterTreeNode` */
    search: (value: string) => void;
}
