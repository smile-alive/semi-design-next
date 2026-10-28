import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';

export interface PopupRegistry {
    register: (container: () => HTMLElement | null) => () => void;
    /** A focusin or focusout inside the popup of a Tooltip whose trigger is `from` */
    relayFocus: (event: FocusEvent, from: Element | null) => void;
}

export const [provideTooltipPopupsContext, useTooltipPopupsContext] = createContext<PopupRegistry>('TooltipPopups', { optional: true });

// A trigger that opts out of aria-describedby (null) because the element the popup describes sits inside it
// (Typography's ellipsis text) reads the popup id here; undefined while the popup is not in the document.
export const [provideTooltipDescription, useTooltipDescription] = createContext<ComputedRef<string | undefined>>('TooltipDescription', { optional: true });

/**
 * The popups of the Tooltips rendered inside the caller, for `useClickOutside` to count as inside: they are teleported
 * out of its DOM, and Vue events do not bubble through the component tree as React portal events do.
 */
export function useNestedPopups() {
    const outer = useTooltipPopupsContext();

    const popups = new Set<() => HTMLElement | null>();

    provideTooltipPopupsContext({
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
