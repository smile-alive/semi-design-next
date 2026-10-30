import type { BaseInputNumberState, ScientificNotationConfig } from '@fibrae/semi-foundation/input-number/foundation';
import type { InputChangeEvent, InputProps } from '../input/interface.js';

export type { ScientificNotationConfig };

/** What changed the value: typing, a step button press, a step or bound key, or the blur that reformats the text */
export type InputNumberChangeEvent = InputChangeEvent | PointerEvent | KeyboardEvent | FocusEvent;

// The listeners below replace Input's: the callbacks carry numbers, and the step buttons add their own. Every other
// attribute reaches the native input; class and style stay on the number wrapper.
type InputOnlyKeys = 'value' | 'type' | 'mode' | 'getValueLength' | 'showClearIgnoreDisabled' | 'onChange' | 'min' | 'max' | 'step';

/** InputNumber's own props plus the Input props it passes on to the Input inside */
export interface InputNumberProps extends Omit<InputProps, InputOnlyKeys> {
    /** Bindable; leave it out for an uncontrolled input. `bind:value={get, set}` makes it fully controlled */
    value?: number | string;
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
    onChange?: (value: number | string, event: InputNumberChangeEvent) => void;
    onNumberChange?: (value: number, event: InputNumberChangeEvent) => void;
    onUpClick?: (value: string, event: PointerEvent) => void;
    onDownClick?: (value: string, event: PointerEvent) => void;
}

export interface InputNumberState extends BaseInputNumberState {}
