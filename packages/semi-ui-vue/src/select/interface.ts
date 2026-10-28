import type { ClassValue, StyleValue, VNode } from 'vue';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { InputProps, ValidateStatus } from '../input/interface';
import type { PopoverProps } from '../popover/interface';
import type { TagCloseEvent } from '../tag/interface';
import type { Position, TooltipProps } from '../tooltip/interface';

export type BasicSelectValue = string | number | Record<string, any>;

type IsDefaultSelectGeneric<T> = [T] extends [BasicSelectValue] ? ([BasicSelectValue] extends [T] ? true : false) : false;

/**
 * Select's value type: without a generic parameter any option value or array of them, with `T` given `T | T[]`
 */
export type SelectValue<T = BasicSelectValue> = IsDefaultSelectGeneric<T> extends true ? BasicSelectValue | any[] | undefined : T | T[] | undefined;

// `true extends Multiple` rather than `Multiple extends true`: the outer conditional distributes, so a `boolean`
// multiple gives `T[] | T | undefined`
export type SelectChangeValue<T, Multiple> = Multiple extends unknown ? (true extends Multiple ? T[] : T | undefined) : never;

export type SelectSize = Size;

export interface SelectVirtualize {
    /** The height of every option row in pixels */
    itemSize: number;
    height?: number;
    width?: string | number;
}

/** What a `SelectOption` declares; any other attribute rides along in the option record */
export interface SelectOptionBaseProps {
    value?: string | number;
    /** Text of the option; content with markup goes in the default slot */
    label?: string | number;
    disabled?: boolean;
    showTick?: boolean;
}

/** An option record: an `optionList` entry, the attributes of a `SelectOption`, and what the events report */
export interface SelectOptionProps extends SelectOptionBaseProps {
    class?: unknown;
    style?: StyleValue;
    [key: string]: any;
}

export interface SelectOptGroupProps {
    /** Text of the group title, also matched by the default filter; a title with markup goes in the `label` slot */
    label?: string | number;
}

/** The search input's extra attributes; listeners use Vue keys such as `onKeydown` */
export type SelectInputProps = Omit<InputProps, 'modelValue' | 'defaultValue'> & {
    class?: unknown;
    style?: StyleValue;
    [key: string]: unknown;
};

export interface SelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = undefined> {
    modelValue?: SelectValue<T>;
    defaultValue?: SelectValue<T>;
    multiple?: Multiple;
    /** Takes precedence over the default slot when not empty */
    optionList?: SelectOptionProps[];
    filter?: boolean | ((inputValue: string, option: SelectOptionProps) => boolean);
    remote?: boolean;
    allowCreate?: boolean;
    autoClearSearchValue?: boolean;
    autofocus?: boolean;
    defaultOpen?: boolean;
    clickToHide?: boolean;
    defaultActiveFirstOption?: boolean;
    /** `change` reports option records instead of values; named without the `on` prefix, which Vue reads as a listener */
    changeWithObject?: boolean;
    max?: number;
    maxTagCount?: number;
    maxHeight?: string | number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: PopoverProps;
    expandRestTagsOnClick?: boolean;
    ellipsisTrigger?: boolean;
    size?: SelectSize;
    disabled?: boolean;
    borderless?: boolean;
    validateStatus?: ValidateStatus;
    placeholder?: string;
    searchPlaceholder?: string;
    searchPosition?: 'trigger' | 'dropdown';
    loading?: boolean;
    showArrow?: boolean;
    showClear?: boolean;
    insetLabelId?: string;
    inputProps?: SelectInputProps;
    dropdownClassName?: string;
    dropdownStyle?: StyleValue;
    dropdownMatchSelectWidth?: boolean;
    position?: Position;
    spacing?: TooltipProps['spacing'];
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    stopPropagation?: boolean;
    virtualize?: SelectVirtualize;
    preventScroll?: boolean;
    /** Id of the trigger; the option ids derive from it */
    id?: string;
}

export interface SelectEmits<T = BasicSelectValue, Multiple extends boolean | undefined = undefined> {
    'update:modelValue': [value: SelectChangeValue<T, Multiple>];
    change: [value: SelectChangeValue<T, Multiple>];
    dropdownVisibleChange: [visible: boolean];
    /** No event when called through the handle's `search` or the trigger slot's `onSearch` */
    search: [value: string, event?: Event];
    select: [value: string | number, option: SelectOptionProps];
    deselect: [value: string | number, option: SelectOptionProps];
    exceed: [option: SelectOptionProps];
    create: [option: SelectOptionProps];
    clear: [];
    /** Once when the focus enters the Select */
    focus: [event: FocusEvent];
    /** Once when the focus leaves the Select; a press outside the open dropdown passes its mousedown event */
    blur: [event: FocusEvent | MouseEvent];
    /** After the Select has handled the key */
    keydown: [event: KeyboardEvent];
    listScroll: [event: Event];
}

export interface SelectOptionItemSlotProps {
    /** Put it on the role="option" element: the combobox's aria-activedescendant points at it */
    id: string;
    value?: string | number;
    label?: string | number;
    selected: boolean;
    focused: boolean;
    disabled?: boolean;
    inputValue: string;
    class: ClassValue;
    style?: StyleValue;
    onClick: (event: MouseEvent) => void;
    onMouseenter: (event: MouseEvent) => void;
    [key: string]: unknown;
}

export interface SelectCreateItemSlotProps {
    inputValue: string;
    focus: boolean;
    style?: StyleValue;
}

export interface SelectSelectedItemSlotProps {
    option: SelectOptionProps;
    index: number;
    disabled: boolean;
    /** Removes the option; in single mode clears the value */
    onClose: (event?: TagCloseEvent) => void;
}

export interface SelectTriggerSlotProps {
    value: SelectOptionProps[];
    inputValue: string;
    placeholder?: string;
    disabled: boolean;
    /** The Select's props */
    componentProps: Record<string, unknown>;
    /** Updates the search keyword */
    onSearch: (inputValue: string) => void;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the list */
    onClear: (event?: MouseEvent) => void;
    onRemove: (option: SelectOptionProps) => void;
}

export interface SelectSlots {
    default?: () => VNode[];
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    insetLabel?: () => VNode[];
    /** An empty slot hides the arrow */
    arrowIcon?: () => VNode[];
    clearIcon?: () => VNode[];
    /** An empty slot hides the empty state */
    emptyContent?: () => VNode[];
    outerTopSlot?: () => VNode[];
    innerTopSlot?: () => VNode[];
    outerBottomSlot?: () => VNode[];
    innerBottomSlot?: () => VNode[];
    /** Replaces a whole option row */
    optionItem?: (props: SelectOptionItemSlotProps) => VNode[];
    /** Content of the row that creates an option from the keyword */
    createItem?: (props: SelectCreateItemSlotProps) => VNode[];
    /** The selected content in single mode, the content of each tag in multiple mode */
    selectedItem?: (props: SelectSelectedItemSlotProps) => VNode[];
    /** Replaces each tag in multiple mode */
    tag?: (props: SelectSelectedItemSlotProps) => VNode[];
    /** Replaces the trigger content */
    trigger?: (props: SelectTriggerSlotProps) => VNode[];
}

export interface SelectOptGroupSlots {
    default?: () => VNode[];
    label?: () => VNode[];
}

export interface SelectOptionSlots {
    default?: () => VNode[];
}

/** The methods on a Select ref */
export interface SelectHandle {
    close: () => void;
    open: () => void;
    /** Focuses the trigger, or the search input when filterable; the dropdown opens only when filterable */
    focus: () => void;
    clearInput: () => void;
    /** Selects every shown, enabled option (multiple only) */
    selectAll: () => void;
    deselectAll: () => void;
    /** Searches as if `value` were typed into the search input */
    search: (value: string, event?: Event) => void;
    /** Repositions the open dropdown at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}
