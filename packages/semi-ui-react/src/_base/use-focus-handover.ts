import { useCallback, useLayoutEffect, useRef } from 'react';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';

/**
 * Returns a callback ref for a node this component may remove while it holds focus (a button that hides itself, a
 * keyed item that remounts, the whole component unmounted by its parent). After the commit that removes it, focus
 * moves to `getTarget()`, which may be a node the same commit mounted.
 */
export default function useFocusHandover<T extends HTMLElement>(getTarget: () => HTMLElement | null | undefined) {
    const left = useRef<T | null>(null);
    const getTargetRef = useRef(getTarget);
    // the cleanup runs while the node is still in the document and still focused; a stable callback keeps re-renders
    // from running it
    const ref = useCallback(
        (node: T) => () => {
            if (node.contains(FocusTrapHandle.getActiveElement(node))) {
                left.current = node;
                // this component's layout effect does not run when it is the one being unmounted; the microtask runs
                // after that commit instead, and is a no-op when the layout effect already handed focus over
                queueMicrotask(() => handoverFocus(node, getTargetRef.current()));
            }
        },
        []
    );
    useLayoutEffect(() => {
        getTargetRef.current = getTarget;
        const node = left.current;
        if (node) {
            left.current = null;
            handoverFocus(node, getTarget());
        }
    });
    return ref;
}
