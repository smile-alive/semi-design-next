import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { VALIDATE_STATUS } from '@fibrae/semi-foundation/base/constants';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { LabelProps } from '../form/interface';

export type InputSize = Size;
export type InputMode = 'password';
// Form can pass 'success', which Input does not style
export type ValidateStatus = (typeof VALIDATE_STATUS)[number];

/** What `change` receives: typing (input), an IME composition ending, or the clear button */
export type InputChangeEvent = Event | CompositionEvent | MouseEvent;

/** The methods and nodes on an Input ref */
export interface InputHandle {
    /** Focuses the native input; `preventScroll` defaults to the prop */
    focus(options?: FocusOptions): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    /** The native input */
    readonly input: HTMLInputElement | null;
    /** The root element, the wrapper div */
    readonly nativeElement: HTMLElement | null;
}

/** Declared so Vue keeps the modifiers off the native element; `emit` applies trim and number itself. */
export interface ModelModifiers {
    trim?: boolean;
    number?: boolean;
}

/**
 * Only Input and TextArea implement `lazy` (typing emits `change` but `update:modelValue` waits for the native change
 * event), so the shared type used by AutoComplete, PinCode and TagInput does not accept it
 */
export interface InputModelModifiers extends ModelModifiers {
    lazy?: boolean;
}

export interface InputProps {
    modelValue?: string | number;
    modelModifiers?: InputModelModifiers;
    defaultValue?: string | number;
    size?: InputSize;
    type?: string;
    mode?: InputMode;
    disabled?: boolean;
    readonly?: boolean;
    borderless?: boolean;
    showClear?: boolean;
    hideSuffix?: boolean;
    /** internal prop, DatePicker use it */
    showClearIgnoreDisabled?: boolean;
    /** When enabled, `change` fires once after an IME composition ends instead of during it */
    composition?: boolean;
    preventScroll?: boolean;
    /** Focuses the input on mount, with `preventScroll` */
    autofocus?: boolean;
    /** Counted by `getValueLength` when given, otherwise the native attribute */
    maxlength?: number;
    minlength?: number;
    placeholder?: string | number;
    validateStatus?: ValidateStatus;
    inputStyle?: StyleValue;
    insetLabelId?: string;
    getValueLength?: (value: string) => number;
}

export interface InputEmits {
    'update:modelValue': [value: string];
    change: [value: string, event: InputChangeEvent];
    clear: [event: MouseEvent];
    /** focusin on the wrapper, so focus moving among the input and its buttons does not fire it */
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    input: [event: Event];
    keydown: [event: KeyboardEvent];
    keyup: [event: KeyboardEvent];
    enterPress: [event: KeyboardEvent];
    compositionstart: [event: CompositionEvent];
    compositionupdate: [event: CompositionEvent];
    compositionend: [event: CompositionEvent];
}

export interface InputSlots {
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    addonBefore?: () => VNode[];
    addonAfter?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
}

export interface InputState {
    value?: string | number;
    cachedValue?: string | number;
    isFocus: boolean;
    eyeClosed: boolean;
}

export interface AutosizeRow {
    minRows?: number;
    maxRows?: number;
}

/** What `change` receives: typing, an IME composition ending, the clear button, or the blur that truncates */
export type TextAreaChangeEvent = Event | CompositionEvent | MouseEvent | FocusEvent;

/** The methods and nodes on a TextArea ref */
export interface TextAreaHandle {
    focus(options?: FocusOptions): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    /** The native textarea */
    readonly textarea: HTMLTextAreaElement | null;
    /** The root element, the wrapper div */
    readonly nativeElement: HTMLElement | null;
}

export interface TextAreaProps {
    modelValue?: string;
    modelModifiers?: InputModelModifiers;
    defaultValue?: string;
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
    lineNumberStyle?: StyleValue;
    textareaStyle?: StyleValue;
    /** Only takes effect when given; ignored with autosize */
    resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline';
    maxlength?: number;
    minlength?: number;
    getValueLength?: (value: string) => number;
}

export interface TextAreaEmits {
    'update:modelValue': [value: string];
    change: [value: string, event: TextAreaChangeEvent];
    clear: [event: MouseEvent];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    input: [event: Event];
    keydown: [event: KeyboardEvent];
    keyup: [event: KeyboardEvent];
    enterPress: [event: KeyboardEvent];
    /** autosize reports the border-box height; a native resize drag reports the content box */
    resize: [size: { height: number; width?: number }];
    compositionstart: [event: CompositionEvent];
    compositionupdate: [event: CompositionEvent];
    compositionend: [event: CompositionEvent];
}

export interface TextAreaState {
    value?: string;
    cachedValue?: string;
    isFocus: boolean;
}

/** Label props plus the label element's id, class and style; nodes go to the `#label` and `#labelExtra` slots */
export interface InputGroupLabel extends LabelProps {
    id?: string;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
}

export interface InputGroupProps {
    size?: InputSize;
    disabled?: boolean;
    label?: InputGroupLabel;
    /** 'top' or 'left' */
    labelPosition?: string;
}

export interface InputGroupEmits {
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
}

export interface InputGroupSlots {
    default?: () => VNode[];
    label?: () => VNode[];
    labelExtra?: () => VNode[];
}
