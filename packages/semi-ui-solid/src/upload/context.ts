import { createContext } from '../_base/create-context';

export interface AddAreaContextValue {
    /** Set by a Semi Button or IconButton created inside the add area */
    hasControl: boolean;
}

export const [AddAreaContext, useAddAreaContext] = createContext<AddAreaContextValue>('AddArea', { optional: true });

/**
 * Tells the enclosing add area that it holds a control. Called from the button's body, which runs on the server
 * too, so the area knows before its first frame rather than from the mounted DOM.
 */
export function useAddAreaControl() {
    const area = useAddAreaContext();
    if (area) {
        area.hasControl = true;
    }
}
