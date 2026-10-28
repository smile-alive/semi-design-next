import type { Accessor } from 'solid-js';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import { createContext } from '../_base/create-context';

export interface InputGroupView {
    size: Size;
    disabled?: boolean;
}

export interface InputGroupContextValue {
    /** The group's size replaces each control's own; its `disabled` applies to controls that set none */
    view: Accessor<InputGroupView>;
    /** The group's undeclared attributes, which every control takes below its own props */
    attrs: Record<string, unknown>;
    /** Popup layer the group was rendered in; controls inside a popup opened from the group do not inherit */
    layer: symbol | undefined;
}

export const [InputGroupContext, useInputGroupContext] = createContext<InputGroupContextValue>('InputGroup', { optional: true });
