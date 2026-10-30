import type { HTMLAttributes } from 'svelte/elements';
import type { PinCodeBaseState } from '@fibrae/semi-foundation/pincode/foundation';
import type { InputSize, ValidateStatus } from '../input/interface.js';

export type PinCodeFormat = 'number' | 'mixed' | RegExp | ((value: string) => boolean);

// The lowercase focus listeners are the whole-code callbacks below; every other attribute lands on the group, except
// the few the cells carry (id, tabindex, aria-describedby, aria-errormessage, aria-invalid, aria-required).
export interface PinCodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onfocus' | 'onblur' | 'onchange'> {
    /** Bindable; leave it out for an uncontrolled code. `bind:value={get, set}` makes it fully controlled */
    value?: string;
    count?: number;
    format?: PinCodeFormat;
    /** Focuses the first cell on mount */
    autofocus?: boolean;
    disabled?: boolean;
    size?: InputSize;
    validateStatus?: ValidateStatus;
    onChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    /** Focus entering the code from outside; moving between the digits does not fire it */
    onFocus?: (event: FocusEvent) => void;
    /** Focus leaving the whole code */
    onBlur?: (event: FocusEvent) => void;
}

export interface PinCodeState extends PinCodeBaseState {}
