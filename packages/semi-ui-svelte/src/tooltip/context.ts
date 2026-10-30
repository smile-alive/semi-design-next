import { createContext } from '../_base/create-context.js';

export interface PopupRegistry {
    register: (container: () => HTMLElement | null) => () => void;
    /** A focusin or focusout inside the popup of a Tooltip whose trigger is `from` */
    relayFocus: (event: FocusEvent, from: Element | null) => void;
}

export const [getTooltipPopupsContext, setTooltipPopupsContext] = createContext<PopupRegistry>('TooltipPopups', { optional: true });

/** What a trigger component (Button, Switch, Checkbox) tells the Tooltip around it about itself */
export interface TriggerState {
    disabled: boolean;
    loading: boolean;
    block: boolean;
    /** The component puts the popup's description on its own control: the wrapper span would not reach it */
    describes?: boolean;
}

/** What the Tooltip hands back to a registered trigger to apply to its own elements */
export interface TriggerBinding {
    /** The Tooltip's span takes the pointer events: a loading Button ignores the pointer and a disabled one gets no click (F4) */
    pointerEventsNone: boolean;
    'aria-describedby'?: string;
    'aria-expanded'?: 'true' | 'false';
    'aria-haspopup'?: 'dialog';
    'aria-controls'?: string;
}

export interface TriggerRegistry {
    register: (element: HTMLElement, state: () => TriggerState) => () => void;
    /** Defined only for the one element the Tooltip's span wraps: that is the trigger, not a component further inside */
    bind: (element?: HTMLElement) => TriggerBinding | undefined;
}

export const [getTriggerContext, setTriggerContext] = createContext<TriggerRegistry>('TooltipTrigger', { optional: true });

/**
 * The popups of the Tooltips rendered inside the caller, for `useClickOutside` to count as inside: they are moved out
 * of its DOM, and Svelte events do not bubble through the component tree as React portal events do.
 */
export function useNestedPopups() {
    const outer = getTooltipPopupsContext();

    const popups = new Set<() => HTMLElement | null>();

    setTooltipPopupsContext({
        register: (popup) => {
            popups.add(popup);
            const unregister = outer?.register(popup);
            return () => {
                popups.delete(popup);
                unregister?.();
            };
        },
        relayFocus: (event, from) => outer?.relayFocus(event, from),
    });

    return () => [...popups].map((popup) => popup());
}
