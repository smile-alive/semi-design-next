import { createContext } from '../_base/create-context.js';
import { getPopupLayerContext } from '../_base/popup-layer.js';
import type { InputSize } from './interface.js';

/** What an InputGroup hands to the controls inside it; read through the getters so group changes stay reactive */
export interface InputGroupContextValue {
    /** Undefined when the group sets none, so a control falls back to the global default */
    readonly size?: InputSize;
    readonly disabled?: boolean;
    /** The popup layer the group renders in; controls in a popup opened from inside the group do not inherit */
    readonly layer?: symbol;
}

// Composite controls (Select, DatePicker...) read the group once, then `setInputGroupContext(undefined)` so the
// Input, Button and TagInput in their own subtree do not read it again
export const [getInputGroupContext, setInputGroupContext] = createContext<InputGroupContextValue>('InputGroup', { optional: true });

/** The enclosing group, unless a popup layer lies between: the context also reaches the content of popups opened from the group */
export function getInputGroupInScope() {
    const group = getInputGroupContext();
    return group?.layer === getPopupLayerContext() ? group : undefined;
}
