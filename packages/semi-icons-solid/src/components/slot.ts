import { type Accessor, type JSX, createContext, onCleanup, useContext } from 'solid-js';
import type { IconSize } from './interface';

/**
 * A component slot that styles the icons rendered in it, where React clones the element: an icon without its own size
 * takes `size`, and every icon takes `class`. Each icon registers the node it renders from its component body, which
 * runs on the server too, so the slot recognizes a lone icon by identity instead of inspecting rendered DOM.
 */
export interface IconSlot {
    size?: Accessor<IconSize | undefined>;
    class?: Accessor<string | undefined>;
    register: (node: JSX.Element) => () => void;
}

export const IconSlotContext = createContext<IconSlot>();

export function useIconSlot() {
    return useContext(IconSlotContext);
}

// The registration ends with the icon
export function registerIcon(slot: IconSlot | undefined, node: JSX.Element) {
    if (slot) {
        onCleanup(slot.register(node));
    }
    return node;
}
