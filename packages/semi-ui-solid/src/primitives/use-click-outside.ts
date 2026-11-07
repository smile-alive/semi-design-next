import { type Accessor, createEffect, onCleanup } from 'solid-js';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';

/**
 * Calls `onOutside` on a `mousedown` that passes through none of `targets`, while `enabled`. `mousedown` rather than
 * `click`: a press inside that is released outside targets their common ancestor, which would read as outside.
 *
 * Returns an `onMouseDown` handler for an element in `targets`: a popup portaled from inside it (such as a Popover in
 * the trigger) is outside its DOM, but Solid still passes the press through the handler of the Portal's logical
 * parent, which marks it as inside before the window sees it.
 */
export default function useClickOutside(targets: Accessor<Node | null | undefined>[], onOutside: (e: MouseEvent) => void, enabled: Accessor<boolean> = () => true) {
    let pressedInside: Event | undefined;

    createEffect(() => {
        if (!enabled()) {
            return;
        }
        const controller = new AbortController();
        // Delegated handlers are not batched (S-H1): enabling from a mousedown handler runs this effect mid-dispatch, and
        // the new listener would still receive that same press.
        const enablingPress = window.event;
        // window, not document: Solid runs delegated handlers on document, and the marker must run first
        window.addEventListener(
            'mousedown',
            (e) => {
                if (e !== enablingPress && e !== pressedInside && !isEventInside(e, ...targets.map((target) => target()))) {
                    onOutside(e);
                }
            },
            { signal: controller.signal }
        );
        onCleanup(() => controller.abort());
    });

    return (e: MouseEvent) => {
        pressedInside = e;
    };
}
