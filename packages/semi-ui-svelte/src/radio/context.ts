import { createContext } from '../_base/create-context.js';
import type { RadioChangeEvent, RadioGroupButtonSize, RadioMode, RadioValue } from './interface.js';

// Read by property, so a radio re-renders for the keys it uses only.
export interface RadioGroupContextValue {
    readonly value?: RadioValue;
    readonly disabled: boolean;
    readonly name: string;
    readonly prefixCls?: string;
    readonly isButtonRadio: boolean;
    readonly isCardRadio: boolean;
    readonly isPureCardRadio: boolean;
    readonly buttonSize: RadioGroupButtonSize;
    readonly mode: RadioMode;
    handleChange: (event: RadioChangeEvent) => void;
    /** Registers a radio's DOM write-back and returns its unregister function. */
    register: (sync: () => void) => () => void;
    /** Writes every registered radio's rendered state back to its native input. */
    sync: () => void;
}

export const [getRadioGroupContext, setRadioGroupContext] = createContext<RadioGroupContextValue>('RadioGroup', { optional: true });
