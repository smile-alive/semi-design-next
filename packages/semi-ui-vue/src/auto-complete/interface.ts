import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { ModelModifiers, ValidateStatus } from '../input/interface';
import type { Position } from '../tooltip/interface';

/** An object item of `data`; markup for its row goes in the `item` slot */
export interface AutoCompleteDataItem {
    [key: string]: any;
    value?: string | number;
    label?: string | number;
    disabled?: boolean;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
}

export type AutoCompleteItems = AutoCompleteDataItem | string | number;

/** A string or number item arrives as `{ value, label }`, an object item as itself */
export type AutoCompleteSelectedItem<T extends AutoCompleteItems> = T extends string | number ? AutoCompleteDataItem : T;

export interface AutoCompleteProps<T extends AutoCompleteItems = AutoCompleteItems> {
    modelValue?: string | number;
    modelModifiers?: ModelModifiers;
    defaultValue?: string | number;
    data?: T[];
    autofocus?: boolean;
    autoAdjustOverflow?: boolean;
    defaultActiveFirstOption?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    dropdownClassName?: string;
    dropdownMatchSelectWidth?: boolean;
    dropdownStyle?: StyleValue;
    insetLabelId?: string;
    loading?: boolean;
    maxHeight?: string | number;
    motion?: boolean;
    /** `select` reports the data item instead of its value; named without the `on` prefix, which Vue reads as a listener */
    selectWithObject?: boolean;
    placeholder?: string;
    position?: Position;
    /** The text the input shows for a picked item; it must return a string */
    renderSelectedItem?: (option: AutoCompleteSelectedItem<T>) => string;
    showClear?: boolean;
    size?: Size;
    stopPropagation?: boolean | string;
    validateStatus?: ValidateStatus;
}

export interface AutoCompleteEmits {
    'update:modelValue': [value: string | number];
    change: [value: string | number];
    search: [inputValue: string];
    /** The item's value, or the item without internal fields when `selectWithObject` is set */
    select: [value: string | number | AutoCompleteDataItem];
    clear: [];
    /** Once when the focus enters the input */
    focus: [event: FocusEvent];
    /** Once when the focus leaves the input */
    blur: [event: FocusEvent];
    dropdownVisibleChange: [visible: boolean];
    /** After the AutoComplete has handled the key */
    keydown: [event: KeyboardEvent];
}

export interface AutoCompleteItemSlotProps<T extends AutoCompleteItems = AutoCompleteItems> {
    /** The data item as given: a string item stays a string */
    item: T;
    /** Position among the rendered items */
    index: number;
}

export interface AutoCompleteTriggerSlotProps<T extends AutoCompleteItems = AutoCompleteItems> {
    /** The selected item, if any */
    value: AutoCompleteDataItem[];
    inputValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    autofocus: boolean;
    size: Size;
    validateStatus: ValidateStatus;
    showClear: boolean;
    insetLabelId?: string;
    /** Updates the input text: reports `search` and `change` and opens the list */
    onChange: (value: string) => void;
    onClear: () => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
    /** The aria-* attributes given to the AutoComplete, for the custom trigger's focusable element */
    controlAttrs: Record<string, unknown>;
    /** The AutoComplete's props */
    componentProps: AutoCompleteProps<T>;
}

export interface AutoCompleteSlots<T extends AutoCompleteItems = AutoCompleteItems> {
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
    /** Shown in the list when `data` is empty */
    emptyContent?: () => VNode[];
    /** Content of an item row; without content the row shows the item's label */
    item?: (props: AutoCompleteItemSlotProps<T>) => VNode[];
    /** Replaces the input */
    trigger?: (props: AutoCompleteTriggerSlotProps<T>) => VNode[];
}

export interface AutoCompleteHandle {
    /** The root div, which wraps the input or the custom trigger */
    readonly nativeElement: HTMLDivElement | null;
}
