import type { VNode } from 'vue';
import type { BaseInputNumberState, ScientificNotationConfig } from '@fibrae/semi-foundation/input-number/foundation';
import type { InputChangeEvent, InputProps } from '../input/interface';

export type { ScientificNotationConfig };

/** What changed the value: typing, a step button press, a step or bound key, or the blur that reformats the text */
export type InputNumberChangeEvent = InputChangeEvent | PointerEvent | KeyboardEvent | FocusEvent;

/** The methods and nodes on an InputNumber ref */
export interface InputNumberHandle {
    /** Focuses the native input; `preventScroll` defaults to the prop */
    focus(options?: FocusOptions): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    /** The native input */
    readonly input: HTMLInputElement | null;
    /** The root element, the number wrapper div */
    readonly nativeElement: HTMLElement | null;
}

/** InputNumber's own props plus the Input props it passes on to the Input inside */
export interface InputNumberProps extends Omit<InputProps, 'modelValue' | 'defaultValue' | 'modelModifiers' | 'type' | 'mode' | 'getValueLength' | 'showClearIgnoreDisabled'> {
    modelValue?: number | string;
    defaultValue?: number | string;
    // boolean first, so that a bare `currency` attribute is read as true rather than ''
    currency?: boolean | string;
    currencyDisplay?: 'code' | 'symbol' | 'name';
    /** The currency for `currency` set to true; defaults to the locale's */
    defaultCurrency?: string;
    /** Defaults to the locale's code */
    localeCode?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    precision?: number;
    /** Shows long numbers in exponent form, and the full number while focused */
    scientificNotation?: boolean | ScientificNotationConfig;
    showCurrencySymbol?: boolean;
    formatter?: (value: number | string) => string;
    parser?: (value: string) => string;
    min?: number;
    max?: number;
    step?: number;
    shiftStep?: number;
    pressInterval?: number;
    pressTimeout?: number;
    keepFocus?: boolean;
    innerButtons?: boolean;
    hideButtons?: boolean;
}

export interface InputNumberEmits {
    'update:modelValue': [value: number | string];
    change: [value: number | string, event: InputNumberChangeEvent];
    numberChange: [value: number, event: InputNumberChangeEvent];
    upClick: [value: string, event: PointerEvent];
    downClick: [value: string, event: PointerEvent];
    /** focusin on the Input wrapper, so focus moving among the input and its buttons does not fire it */
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    keydown: [event: KeyboardEvent];
}

export interface InputNumberSlots {
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    insetLabel?: () => VNode[];
    clearIcon?: () => VNode[];
    addonBefore?: () => VNode[];
    addonAfter?: () => VNode[];
}

export interface InputNumberState extends BaseInputNumberState {}
