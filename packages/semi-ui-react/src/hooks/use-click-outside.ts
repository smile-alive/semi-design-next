import { type RefObject, type MouseEvent as ReactMouseEvent, useCallback, useRef } from 'react';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import useEventListener, { getDocument } from './use-event-listener';

/**
 * Calls `onOutside` on a `mousedown` that passes through none of `refs`, while `enabled`. `mousedown` rather than
 * `click`: a press inside that is released outside targets their common ancestor, which would read as outside.
 *
 * Returns an `onMouseDownCapture` handler for an element in `refs`: a popup portaled from inside it (such as a
 * Popover in the trigger) is outside its DOM, but React still passes the press through the handler, which marks it
 * as inside before the document sees it.
 */
export default function useClickOutside(refs: RefObject<Node | null>[], onOutside: (e: MouseEvent) => void, enabled: boolean) {
    const pressedInside = useRef<Event | null>(null);
    useEventListener(
        getDocument,
        'mousedown',
        (e) => {
            if (e !== pressedInside.current && !isEventInside(e, ...refs.map((ref) => ref.current))) {
                onOutside(e);
            }
        },
        { enabled }
    );
    return useCallback((e: ReactMouseEvent) => {
        pressedInside.current = e.nativeEvent;
    }, []);
}
