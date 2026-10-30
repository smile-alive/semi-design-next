import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { ValidateStatus } from '../input/index.js';
import type { Position } from '../tooltip/index.js';

/** An object item of `data`; markup for its row goes in the `item` snippet */
export interface AutoCompleteDataItem {
    [key: string]: any;
    value?: string | number;
    label?: string | number;
    disabled?: boolean;
    /** On the item's row */
    class?: ClassValue;
    /** On the item's row */
    style?: string;
}

export type AutoCompleteItems = AutoCompleteDataItem | string | number;

/** A string or number item arrives as `{ value, label }`, an object item as itself */
export type AutoCompleteSelectedItem<T extends AutoCompleteItems> = T extends string | number ? AutoCompleteDataItem : T;

export interface AutoCompleteItemSnippetProps<T extends AutoCompleteItems = AutoCompleteItems> {
    /** The data item as given: a string item stays a string */
    item: T;
    /** Position among the rendered items */
    index: number;
}

export interface AutoCompleteTriggerSnippetProps {
    /** The selected item, if any */
    value: AutoCompleteDataItem[];
    inputValue?: string | number;
    placeholder?: string;
    disabled: boolean;
    autofocus: boolean;
    size: Size;
    validateStatus: ValidateStatus;
    showClear: boolean;
    insetLabelId?: string;
    /** Updates the input text: reports `onSearch` and `onChange` and opens the list */
    onChange: (value: string) => void;
    onClear: () => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
    /** The aria-* attributes given to the AutoComplete, for the custom trigger's focusable element */
    controlAttrs: Record<string, unknown>;
}

// `onfocus` and `onblur` are the callbacks below, which report the focus entering and leaving the input; `onkeydown`
// stays the native listener on the root and runs after the AutoComplete has handled the key. `name` reaches the input,
// which the root div's attributes do not cover.
type NativeKeys = 'children' | 'prefix' | 'placeholder' | 'onchange' | 'onselect' | 'onfocus' | 'onblur';

export interface AutoCompleteProps<T extends AutoCompleteItems = AutoCompleteItems> extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys>, Pick<HTMLInputAttributes, 'name'> {
    /** Bindable; leave it out for an uncontrolled AutoComplete. `bind:value={get, set}` makes it fully controlled */
    value?: string | number;
    data?: T[];
    autofocus?: boolean;
    autoAdjustOverflow?: boolean;
    defaultActiveFirstOption?: boolean;
    /** Opens the list on mount; AutoComplete has no controlled open state */
    defaultOpen?: boolean;
    disabled?: boolean;
    dropdownClassName?: string;
    dropdownMatchSelectWidth?: boolean;
    dropdownStyle?: string;
    insetLabelId?: string;
    loading?: boolean;
    maxHeight?: string | number;
    motion?: boolean;
    /** `onSelect` reports the data item instead of its value */
    onSelectWithObject?: boolean;
    placeholder?: string;
    position?: Position;
    /** The text the input shows for a picked item; it must return a string */
    renderSelectedItem?: (option: AutoCompleteSelectedItem<T>) => string;
    showClear?: boolean;
    size?: Size;
    stopPropagation?: boolean | string;
    validateStatus?: ValidateStatus;
    onChange?: (value: string | number) => void;
    onSearch?: (inputValue: string) => void;
    /** The item's value, or the item without internal fields with `onSelectWithObject` */
    onSelect?: (value: string | number | AutoCompleteDataItem) => void;
    onClear?: () => void;
    /** Once when the focus enters the input */
    onFocus?: (event: FocusEvent) => void;
    /** Once when the focus leaves the input */
    onBlur?: (event: FocusEvent) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
    prefix?: Snippet;
    suffix?: Snippet;
    insetLabel?: Snippet;
    clearIcon?: Snippet;
    /** Shown in the list when `data` is empty */
    emptyContent?: Snippet;
    /** Content of an item row; without it the row shows the item's label */
    item?: Snippet<[AutoCompleteItemSnippetProps<T>]>;
    /** Replaces the input */
    trigger?: Snippet<[AutoCompleteTriggerSnippetProps]>;
}
