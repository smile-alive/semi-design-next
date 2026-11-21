import type { ClassValue, StyleValue, VNode } from 'vue';
import type { OptionPart, SelectPart } from '@fibrae/semi-foundation/components/select/constants';
import type { SelectRawValue } from '@fibrae/semi-foundation/components/select/option-foundation';
import type { Size } from '@fibrae/semi-foundation/utils';
import type { InputProps, ValidateStatus } from '../input/interface';
import type { PopoverProps } from '../popover/interface';
import type { TagCloseEvent } from '../tag/interface';
import type { Position, TooltipProps } from '../tooltip/interface';

export type { SelectRawValue };

type WidenRaw<V> = V extends string ? string : V extends number ? number : V extends boolean ? boolean : V;
type Picked<V extends SelectRawValue, WithObject> = WithObject extends unknown ? (true extends WithObject ? SelectOptionProps<V> : V) : never;

// `true extends Multiple` rather than `Multiple extends true`: the outer conditional distributes, so a `boolean`
// multiple gives `Picked[] | Picked | undefined`
/** What `change` carries: the option value, or the option record with `changeWithObject`; an array with `multiple` */
export type SelectChangeValue<V extends SelectRawValue, Multiple, WithObject> = Multiple extends unknown ? (true extends Multiple ? Picked<V, WithObject>[] : Picked<V, WithObject> | undefined) : never;

/**
 * What `modelValue` and `defaultValue` take. A literal V is widened to its primitive: V is inferred from an inline
 * `optionList` as a literal union, and a state typed `string` must still fit options `'a' | 'b'`
 */
export type SelectValue<V extends SelectRawValue = string | number, Multiple = undefined, WithObject = undefined> = SelectChangeValue<WidenRaw<V>, Multiple, WithObject>;

export type SelectSize = Size;

export interface SelectVirtualize {
    itemSize: number;
    height?: number;
    width?: string | number;
}

export interface SelectOptionBaseProps<V extends SelectRawValue = SelectRawValue> {
    value?: V;
    /** Text of the option; content with markup goes in the default slot */
    label?: string | number;
    disabled?: boolean;
    showTick?: boolean;
    classNames?: Partial<Record<OptionPart, ClassValue>>;
    styles?: Partial<Record<OptionPart, StyleValue>>;
}

export interface SelectOptionProps<V extends SelectRawValue = SelectRawValue> extends SelectOptionBaseProps<V> {
    class?: unknown;
    style?: StyleValue;
    [key: string]: any;
}

export interface SelectOptGroupProps {
    /** Text of the group title, also matched by the default filter; a title with markup goes in the `label` slot */
    label?: string | number;
}

export type SelectInputProps = Omit<InputProps, 'modelValue' | 'defaultValue'> & {
    class?: unknown;
    style?: StyleValue;
    [key: string]: unknown;
};

/** `V` is the option value type, inferred from `optionList`; `Multiple` follows `multiple`, `WithObject` follows `changeWithObject` */
export interface SelectProps<V extends SelectRawValue = string | number, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined> {
    modelValue?: SelectValue<V, Multiple, WithObject>;
    defaultValue?: SelectValue<V, Multiple, WithObject>;
    multiple?: Multiple;
    /** Takes precedence over the default slot when not empty */
    optionList?: readonly SelectOptionProps<V>[];
    filter?: boolean | ((inputValue: string, option: SelectOptionProps<V>) => boolean);
    remote?: boolean;
    allowCreate?: boolean;
    autoClearSearchValue?: boolean;
    autofocus?: boolean;
    defaultOpen?: boolean;
    clickToHide?: boolean;
    defaultActiveFirstOption?: boolean;
    /** `change` reports option records instead of values; named without the `on` prefix, which Vue reads as a listener */
    changeWithObject?: WithObject;
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
    classNames?: Partial<Record<SelectPart, ClassValue>>;
    styles?: Partial<Record<SelectPart, StyleValue>>;
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

export interface SelectEmits<V extends SelectRawValue = string | number, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined> {
    'update:modelValue': [value: SelectChangeValue<V, Multiple, WithObject>];
    change: [value: SelectChangeValue<V, Multiple, WithObject>];
    dropdownVisibleChange: [visible: boolean];
    /** No event when called through the handle's `search` or the trigger slot's `onSearch` */
    search: [value: string, event?: Event];
    select: [value: V, option: SelectOptionProps<V>];
    deselect: [value: V, option: SelectOptionProps<V>];
    exceed: [option: SelectOptionProps<V>];
    create: [option: SelectOptionProps];
    clear: [];
    focus: [event: FocusEvent];
    /** Once when the focus leaves the Select; a press outside the open dropdown passes its mousedown event */
    blur: [event: FocusEvent | MouseEvent];
    keydown: [event: KeyboardEvent];
    listScroll: [event: Event];
}

export interface SelectOptionItemSlotProps<V extends SelectRawValue = SelectRawValue> {
    /** Put it on the role="option" element: the combobox's aria-activedescendant points at it */
    id: string;
    value?: V;
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
    componentProps: Record<string, unknown>;
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
    arrowIcon?: () => VNode[];
    clearIcon?: () => VNode[];
    emptyContent?: () => VNode[];
    outerTopSlot?: () => VNode[];
    innerTopSlot?: () => VNode[];
    outerBottomSlot?: () => VNode[];
    innerBottomSlot?: () => VNode[];
    optionItem?: (props: SelectOptionItemSlotProps) => VNode[];
    createItem?: (props: SelectCreateItemSlotProps) => VNode[];
    /** The selected content in single mode, the content of each tag in multiple mode */
    selectedItem?: (props: SelectSelectedItemSlotProps) => VNode[];
    tag?: (props: SelectSelectedItemSlotProps) => VNode[];
    trigger?: (props: SelectTriggerSlotProps) => VNode[];
}

export interface SelectOptGroupSlots {
    default?: () => VNode[];
    label?: () => VNode[];
}

export interface SelectOptionSlots {
    default?: () => VNode[];
}

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
