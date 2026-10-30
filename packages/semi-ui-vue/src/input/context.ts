import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import { usePopupLayer } from '../_base/popup-layer';
import type { InputSize } from './interface';

export interface InputGroupContext {
    size?: InputSize;
    disabled?: boolean;
    /** Popup layer the group was rendered in; controls inside a popup opened from the group do not inherit. */
    layer?: symbol;
}

// `undefined` is a valid value: a control that renders other Semi controls inside itself provides it to cut them off from the group.
export const [provideInputGroupContext, useInputGroupContext] = createContext<ComputedRef<InputGroupContext> | undefined>('InputGroup', { optional: true });

/** The enclosing group, unless a popup layer lies between it and the caller */
export function useInputGroupInScope() {
    const group = useInputGroupContext();
    const layer = usePopupLayer();

    return group && group.value.layer === layer ? group : undefined;
}
