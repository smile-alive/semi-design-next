import { onCleanup } from 'solid-js';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';

/**
 * Returns a ref callback for a node this component may remove while it holds focus (a button that hides itself, a
 * keyed item that remounts, the whole component unmounted by its parent). The cleanup runs in the owner that created
 * the node, before the DOM is detached, so the node is still focused; after that update, focus moves to
 * `getTarget()`, which may be a node the same update mounted. Chrome fires focusout (relatedTarget null) from the node
 * as the update removes it, so a component that reports blur on focusout ignores that one (see Input).
 */
export default function useFocusHandover<T extends HTMLElement>(getTarget: () => HTMLElement | null | undefined) {
    return (node: T) => {
        onCleanup(() => {
            if (node.contains(FocusTrapHandle.getActiveElement(node))) {
                // the microtask runs after the update that removes the node; handoverFocus is a no-op when the node is still connected
                queueMicrotask(() => handoverFocus(node, getTarget()));
            }
        });
    };
}
