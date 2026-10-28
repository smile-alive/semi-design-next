import { untrack } from 'solid-js';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';

/** Focuses `element` through the prototype, past a `focus()` that `forwardFocus` replaced on it */
export function focusElement(element: HTMLElement, options?: FocusOptions) {
    HTMLElement.prototype.focus.call(element, options);
}

/**
 * Makes `focus()` and `blur()` on a root that is not the focus target reach the control that is. The consumer's `ref`
 * receives the root (F2) and Solid has no imperative handle, so this is how `ref.focus()` focuses a Checkbox's native
 * input, as the React handle does; Tooltip and focus handover call `focus()` on the root too. `target` is read at call
 * time, so it can pick one of several controls, or the root itself (a Select whose root is the combobox); `blur()`
 * blurs whichever of them holds focus. `target` and `defaults` are read untracked, so calling `focus()` from an effect
 * does not subscribe it to the props they read.
 */
export default function forwardFocus(root: HTMLElement, target: () => HTMLElement | null | undefined, defaults?: () => FocusOptions) {
    root.focus = (options?: FocusOptions) =>
        untrack(() => {
            const element = target();
            const merged = { ...defaults?.(), ...options };
            if (element === root) {
                focusElement(root, merged);
            } else {
                element?.focus(merged);
            }
        });
    root.blur = () => {
        const active = FocusTrapHandle.getActiveElement(root);
        if (active === root) {
            HTMLElement.prototype.blur.call(root);
        } else if (active && root.contains(active)) {
            active.blur();
        }
    };
}
