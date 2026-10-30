import type { Size } from '@fibrae/semi-foundation/utils/type';
import { createContext } from '../_base/create-context';
import { usePopupLayer } from '../_base/popup-layer';

export interface InputGroupLooks {
    size?: Size;
    disabled?: boolean;
}

export interface InputGroupContextType extends InputGroupLooks {
    /** Popup layer the group was rendered in; controls inside a popup opened from the group do not inherit. */
    layer?: symbol;
}

// Kept free of component imports: Form's label imports Input, so the controls and the group both read from here
export const [InputGroupContext, useInputGroupContext] = createContext<InputGroupContextType>('InputGroup', { optional: true });

/** The enclosing InputGroup's values, unless a popup layer lies between the group and the caller */
export function useInputGroupInScope(): InputGroupLooks | undefined {
    const group = useInputGroupContext();
    const layer = usePopupLayer();
    return group?.layer === layer ? group : undefined;
}

/**
 * Fills the control's unset size and disabled from the group. Applied before global and built-in defaults, so the
 * order is own -> group -> global -> built-in; `undefined` counts as not passed.
 */
export function withInputGroup<P extends InputGroupLooks>(own: P, group?: InputGroupLooks): P {
    if (!group) {
        return own;
    }
    return { ...own, size: own.size ?? group.size, disabled: own.disabled ?? group.disabled };
}

/** For controls without a size (TextArea): only disabled is inherited */
export function withInputGroupDisabled<P extends Pick<InputGroupLooks, 'disabled'>>(own: P, group?: InputGroupLooks): P {
    if (!group) {
        return own;
    }
    return { ...own, disabled: own.disabled ?? group.disabled };
}
