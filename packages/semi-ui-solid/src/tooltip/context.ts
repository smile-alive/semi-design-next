import { type Accessor, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';
import { createContext } from '../_base/create-context';

// A trigger that opts out of aria-describedby (null) because the element the popup describes sits inside it
// (Typography's ellipsis text) reads the popup id here; undefined while the popup is not in the document.
export const [TooltipDescriptionContext, useTooltipDescription] = createContext<Accessor<string | undefined>>('TooltipDescription', { optional: true });

export interface SpecialTriggerState {
    disabled: boolean;
    loading: boolean;
    block: boolean;
}

/**
 * Each trigger component's root element -> its state, so an enclosing Tooltip can wrap a disabled or loading trigger
 * (F4). On the server, where no ref runs, the key is the ref getTriggerProps handed the component.
 */
export const [SpecialTriggerContext, useSpecialTriggers] = createContext<WeakMap<object, Accessor<SpecialTriggerState>>>('SpecialTrigger', { optional: true });

/**
 * Returns the callback that registers a trigger component's root with the enclosing Tooltip. `state` gives only the
 * fields the component has; missing or undefined ones read as false. `ref` is the component's own `ref` prop: no ref
 * runs on the server, and Tooltip reads the state there while it writes the markup, so the ref getTriggerProps handed
 * over is registered here, in the component body, in place of the element.
 */
export function useSpecialTrigger(state: Accessor<Partial<SpecialTriggerState>>, ref: Accessor<unknown>) {
    const triggers = useSpecialTriggers();
    const normalized = () => {
        const { disabled, loading, block } = state();
        return { disabled: Boolean(disabled), loading: Boolean(loading), block: Boolean(block) };
    };
    const register = (node: object) => {
        triggers?.set(node, normalized);
    };
    const triggerRef = untrack(ref);
    if (isServer && typeof triggerRef === 'function') {
        register(triggerRef);
    }
    return register;
}

/**
 * The popups of the Tooltips rendered inside a Tooltip's trigger or content, nested ones included. They are portaled
 * out of its DOM, so the click-outside check and `:hover` never see them, while React's Fragment ref and portal events
 * reach the ancestors through the component tree. A Tooltip provides one value for its trigger and one for its content.
 */
export interface TooltipPopups {
    /** Registers a descendant popup with this Tooltip and every enclosing one; returns the unregistration */
    register: (popup: Accessor<HTMLElement | undefined>) => () => void;
    /**
     * A mouseenter or mouseleave on a descendant popup, handed to every enclosing Tooltip whose content renders it.
     * Those events do not bubble; focusin and focusout are delegated and already reach that popup through the Portal.
     */
    relay: (event: Event) => void;
}

export const [TooltipPopupsContext, useTooltipPopups] = createContext<TooltipPopups>('TooltipPopups', { optional: true });
