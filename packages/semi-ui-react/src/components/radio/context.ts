import type { strings } from '@fibrae/semi-foundation/components/radio/constants';
import type { RadioChangeEvent } from '@fibrae/semi-foundation/components/radio/radio-foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import { createContext } from '../../base/index';

export type RadioGroupButtonSize = ArrayElement<typeof strings.BUTTON_SIZE>;
export type RadioMode = ArrayElement<typeof strings.MODE>;
export interface RadioContextValue {
    mode?: RadioMode;
    radioGroup?: {
        value?: string | number | boolean;
        isButtonRadio?: boolean;
        disabled?: boolean;
        name?: string;
        onChange?: (e: RadioChangeEvent) => void;
        buttonSize?: RadioGroupButtonSize;
        isCardRadio?: boolean;
        isPureCardRadio?: boolean;
    };
}

export const [RadioGroupContext, useRadioGroupContext] = createContext<RadioContextValue>('RadioGroup', { optional: true });
