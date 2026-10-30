import type { Accessor, JSX } from 'solid-js';
import type { ButtonLooks } from '@fibrae/semi-foundation/button/utils';
import { createContext } from '../_base/create-context';

export type { ButtonLooks } from '@fibrae/semi-foundation/button/utils';

export type ButtonGroupLooks = Partial<ButtonLooks>;

export interface ButtonGroupContextValue {
    view: Accessor<ButtonGroupLooks>;
    /** Popup layer the group was rendered in; buttons inside a popup opened from the group do not inherit */
    layer?: symbol;
    /**
     * Each button's rendered root (an element, or the server's markup object) -> its effective looks, so the group
     * draws a separator that matches the button
     */
    buttons: WeakMap<object, Accessor<ButtonLooks>>;
}

export const [ButtonGroupContext, useButtonGroupContext] = createContext<ButtonGroupContextValue>('ButtonGroup', { optional: true });

/**
 * Registers a button's rendered root with its group. Called from the component body, which runs on the server too,
 * unlike a ref callback.
 */
export function useGroupItem(group: ButtonGroupContextValue | undefined, node: JSX.Element, looks: Accessor<ButtonLooks>) {
    group?.buttons.set(node as object, looks);
}
