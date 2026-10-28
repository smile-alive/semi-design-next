import { inheritGroupLooks } from '@fibrae/semi-foundation/button/utils';
import { createContext } from '../_base/create-context';
import { usePopupLayer } from '../_base/popup-layer';
import type { ButtonProps } from './button';

export type ButtonGroupLooks = Pick<ButtonProps, 'disabled' | 'size' | 'type' | 'theme' | 'colorful'>;

export interface ButtonGroupContextType extends ButtonGroupLooks {
    /** Popup layer the group was rendered in; buttons inside a popup opened from the group do not inherit. */
    layer?: symbol;
}

export const [ButtonGroupContext, useButtonGroupContext] = createContext<ButtonGroupContextType>('ButtonGroup', { optional: true });

/** The enclosing ButtonGroup's values, unless a popup layer lies between the group and the caller */
export function useButtonGroupLooks(): ButtonGroupLooks | undefined {
    const group = useButtonGroupContext();
    const layer = usePopupLayer();
    return group?.layer === layer ? group : undefined;
}

/** Fills the button's unset looks from the group; applied before global defaults, so own -> group -> global as in Vue */
export function withGroupLooks<P extends ButtonGroupLooks>(own: P, group?: ButtonGroupLooks) {
    if (!group) {
        return own;
    }
    return { ...own, ...inheritGroupLooks(own, group) };
}
