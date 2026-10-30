import type { Accessor } from 'solid-js';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import { createContext } from '../_base/create-context';

export interface InputGroupView {
    size?: Size;
    disabled?: boolean;
}

export interface InputGroupContextValue {
    /** Fills the size and `disabled` a control does not set itself, ahead of the global defaults */
    view: Accessor<InputGroupView>;
    /** Popup layer the group was rendered in; controls inside a popup opened from the group do not inherit */
    layer?: symbol;
}

export const [InputGroupContext, useInputGroupContext] = createContext<InputGroupContextValue>('InputGroup', { optional: true });
