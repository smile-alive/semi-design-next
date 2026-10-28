import type { strings } from '@fibrae/semi-foundation/radio/constants';
import type { RadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
import type { ArrayElement } from '../_base/base';
import { createContext } from '../_base/create-context';

export type RadioGroupButtonSize = ArrayElement<typeof strings.BUTTON_SIZE>;
export type RadioMode = ArrayElement<typeof strings.MODE>;
export interface RadioContextValue {
    mode?: RadioMode;
    radioGroup?: {
        value?: string | number | boolean;
        isButtonRadio?: boolean;
        disabled?: boolean;
        prefixCls?: string;
        name?: string;
        onChange?: (e: RadioChangeEvent) => void;
        buttonSize?: RadioGroupButtonSize;
        isCardRadio?: boolean;
        isPureCardRadio?: boolean;
    };
}

export const [RadioGroupContext, useRadioGroupContext] = createContext<RadioContextValue>('RadioGroup', { optional: true });
