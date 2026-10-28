import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { RadioGroupButtonSize, RadioChangeEvent, RadioMode, RadioValue } from './interface';

export interface RadioGroupContextView {
    value?: RadioValue;
    disabled: boolean;
    name: string;
    prefixCls?: string;
    isButtonRadio: boolean;
    isCardRadio: boolean;
    isPureCardRadio: boolean;
    buttonSize: RadioGroupButtonSize;
    mode: RadioMode;
}

export interface RadioGroupContext {
    view: ComputedRef<RadioGroupContextView>;
    onChange: (event: RadioChangeEvent) => void;
    /** Registers a radio's DOM write-back and returns its unregister function. */
    register: (sync: () => void) => () => void;
    /** Asks every registered radio to write its rendered state back to its native input once rendering settles. */
    sync: () => void;
}

export const [provideRadioGroupContext, useRadioGroupContext] = createContext<RadioGroupContext>('RadioGroup', { optional: true });
