import type { PinCodeBaseState } from '@fibrae/semi-foundation/pincode/foundation';
import type { InputSize, ModelModifiers, ValidateStatus } from '../input/interface';

// `RegExp & object` is equivalent to RegExp in TS; plain RegExp is not in compiler-sfc's runtime type whitelist,
// so the production build would drop it from the prop's runtime type and warn on every RegExp value
export type PinCodeFormat = 'number' | 'mixed' | (RegExp & object) | ((value: string) => boolean);

export interface PinCodeProps {
    modelValue?: string;
    modelModifiers?: ModelModifiers;
    defaultValue?: string;
    count?: number;
    format?: PinCodeFormat;
    autofocus?: boolean;
    disabled?: boolean;
    size?: InputSize;
    validateStatus?: ValidateStatus;
}

export interface PinCodeEmits {
    'update:modelValue': [value: string];
    change: [value: string];
    complete: [value: string];
    /** Focus entering the code from outside; moving between the digits does not fire it */
    focus: [event: FocusEvent];
    /** Focus leaving the whole code */
    blur: [event: FocusEvent];
}

export interface PinCodeHandle {
    /** Focuses the input at `index` (0-based) with the caret after its character */
    focus: (index: number) => void;
    blur: (index: number) => void;
}

export interface PinCodeState extends PinCodeBaseState {}
