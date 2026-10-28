import type { Accessor } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/radio/constants';
import type { RadioChangeEvent, RadioContextView } from '@fibrae/semi-foundation/radio/radio-foundation';
import { createContext } from '../_base/create-context';

export type RadioGroupButtonSize = (typeof strings.BUTTON_SIZE)[number];
export type RadioMode = (typeof strings.MODE)[number];

export interface RadioGroupContextValue {
    view: Accessor<RadioContextView>;
    onChange: (event: RadioChangeEvent) => void;
    /**
     * Registers a radio's write-back of its native `checked`; returns the unregistration. The browser unchecks the
     * previous radio of a name group without an event on it, so a group writes every member back at once.
     */
    register: (sync: () => void) => () => void;
    sync: () => void;
}

export const [RadioGroupContext, useRadioGroupContext] = createContext<RadioGroupContextValue>('RadioGroup', { optional: true });
