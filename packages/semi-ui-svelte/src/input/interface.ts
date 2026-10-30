import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes, HTMLTextareaAttributes } from 'svelte/elements';
import type { VALIDATE_STATUS } from '@fibrae/semi-foundation/base/constants';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { LabelProps } from '../form/interface.js';

export type InputSize = Size;
export type InputMode = 'password';
// Form can pass 'success', which Input does not style
export type ValidateStatus = (typeof VALIDATE_STATUS)[number];

/** What `onChange` receives: typing (input), an IME composition ending, or the clear button */
export type InputChangeEvent = Event | CompositionEvent | MouseEvent;

/** What `onChange` receives: typing, an IME composition ending, the clear button, or the blur that truncates */
export type TextAreaChangeEvent = Event | CompositionEvent | MouseEvent | FocusEvent;

export interface AutosizeRow {
    minRows?: number;
    maxRows?: number;
}

// Props the component declares replace the native ones of the same meaning: `size` is a number natively, `prefix` an
// RDFa string, and the lowercase listeners are the camelCase callbacks below. Every other attribute reaches the native
// input; class and style stay on the wrapper.
type NativeInputKeys = 'children' | 'value' | 'defaultValue' | 'size' | 'type' | 'placeholder' | 'prefix' | 'onchange' | 'oninput' | 'onfocus' | 'onblur' | 'onkeydown' | 'onkeyup' | 'oncompositionstart' | 'oncompositionupdate' | 'oncompositionend';

export interface InputProps extends Omit<HTMLInputAttributes, NativeInputKeys> {
    /** Bindable; leave it out for an uncontrolled input. `bind:value={get, set}` makes it fully controlled */
    value?: string | number;
    size?: InputSize;
    type?: string;
    mode?: InputMode;
    disabled?: boolean;
    /** Locks typing and hides the clear button; the native `readOnly` locks typing only */
    readonly?: boolean;
    /** Locks typing only, the clear button stays (pickers rely on it) */
    readOnly?: boolean;
    borderless?: boolean;
    showClear?: boolean;
    hideSuffix?: boolean;
    /** internal prop, DatePicker use it */
    showClearIgnoreDisabled?: boolean;
    /** When enabled, `onChange` fires once after an IME composition ends instead of during it */
    composition?: boolean;
    preventScroll?: boolean;
    /** Focuses the input on mount, with `preventScroll` */
    autofocus?: boolean;
    /** Counted by `getValueLength` when given, otherwise the native attribute */
    maxlength?: number;
    minlength?: number;
    placeholder?: string | number;
    validateStatus?: ValidateStatus;
    inputStyle?: string;
    insetLabelId?: string;
    getValueLength?: (value: string) => number;
    onChange?: (value: string, event: InputChangeEvent) => void;
    onClear?: (event: MouseEvent) => void;
    /** focusin on the wrapper, so focus moving among the input and its buttons does not fire it */
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onInput?: (event: Event) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onEnterPress?: (event: KeyboardEvent) => void;
    onCompositionStart?: (event: CompositionEvent) => void;
    onCompositionUpdate?: (event: CompositionEvent) => void;
    onCompositionEnd?: (event: CompositionEvent) => void;
    prefix?: Snippet;
    suffix?: Snippet;
    addonBefore?: Snippet;
    addonAfter?: Snippet;
    insetLabel?: Snippet;
    clearIcon?: Snippet;
}

export interface InputState {
    value?: string | number;
    cachedValue?: string | number;
    isFocus: boolean;
    eyeClosed: boolean;
}

type NativeTextAreaKeys = 'children' | 'value' | 'defaultValue' | 'placeholder' | 'onchange' | 'oninput' | 'onfocus' | 'onblur' | 'onkeydown' | 'onkeyup' | 'oncompositionstart' | 'oncompositionupdate' | 'oncompositionend';

export interface TextAreaProps extends Omit<HTMLTextareaAttributes, NativeTextAreaKeys> {
    /** Bindable; leave it out for an uncontrolled textarea. `bind:value={get, set}` makes it fully controlled */
    value?: string;
    autosize?: boolean | AutosizeRow;
    borderless?: boolean;
    rows?: number;
    cols?: number;
    placeholder?: string;
    maxCount?: number;
    showCounter?: boolean;
    showClear?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    /** Focuses the textarea on mount */
    autofocus?: boolean;
    validateStatus?: ValidateStatus;
    composition?: boolean;
    /** Internal, used by Chat: Enter does not start a new line, Shift+Enter does */
    disabledEnterStartNewLine?: boolean;
    showLineNumber?: boolean;
    lineNumberStart?: number;
    lineNumberClassName?: string;
    lineNumberStyle?: string;
    textareaStyle?: string;
    /** Only takes effect when given; ignored with autosize */
    resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline';
    maxlength?: number;
    minlength?: number;
    getValueLength?: (value: string) => number;
    onChange?: (value: string, event: TextAreaChangeEvent) => void;
    onClear?: (event: MouseEvent) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onInput?: (event: Event) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onEnterPress?: (event: KeyboardEvent) => void;
    /** autosize reports the border-box height; a native resize drag reports the content box */
    onResize?: (size: { height: number; width?: number }) => void;
    onCompositionStart?: (event: CompositionEvent) => void;
    onCompositionUpdate?: (event: CompositionEvent) => void;
    onCompositionEnd?: (event: CompositionEvent) => void;
}

export interface TextAreaState {
    value?: string;
    cachedValue?: string;
    isFocus: boolean;
}

/** Label props plus the label element's attributes such as id, class and style; nodes go to the `fieldLabel` and `labelExtra` snippets */
export type InputGroupLabel = Omit<LabelProps, 'children' | 'extra'>;

/** Undeclared attributes go on the group's `role="group"` element and are not passed to the controls inside */
export interface InputGroupProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onfocus' | 'onblur'> {
    /** Default size of the controls inside at any depth; a control's own `size` wins */
    size?: InputSize;
    /** Default `disabled` of the controls inside at any depth; a control's own `disabled`, including `false`, wins */
    disabled?: boolean;
    /** Renders a FormLabel that names the group; `name` becomes the group's id */
    label?: InputGroupLabel;
    labelPosition?: 'top' | 'left';
    /** Label content, in place of `label.text` */
    fieldLabel?: Snippet;
    labelExtra?: Snippet;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
}
