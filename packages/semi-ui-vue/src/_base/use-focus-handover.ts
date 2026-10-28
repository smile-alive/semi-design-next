import { type ComponentPublicInstance, nextTick } from 'vue';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';

/**
 * Returns a function ref (`:ref="handover"`) for a node this component may remove while it holds focus (a button that
 * hides itself, a keyed item that remounts). Vue calls it with null at the start of the unmount, while the node is
 * still in the document; after that flush, focus moves to `getTarget()`, which may be a node the same flush mounted.
 * Known limit: a node leaving through `<Transition>` stays in the document until the leave ends, so no handover
 * happens; move focus in the handler that starts the leave instead.
 */
export default function useFocusHandover(getTarget: () => HTMLElement | null | undefined) {
    let node: Element | null = null;

    return (el: Element | ComponentPublicInstance | null) => {
        if (el) {
            node = el instanceof Element ? el : (el.$el as Element);
            return;
        }
        const left = node;
        node = null;
        if (left?.contains(FocusTrapHandle.getActiveElement(left))) {
            void nextTick(() => handoverFocus(left, getTarget()));
        }
    };
}
