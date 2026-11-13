import { useInsertionEffect, useLayoutEffect } from 'react';
import useDidUpdate from './use-did-update';

interface OverlayFoundation {
    recordFocus: () => void;
    beforeShow: () => void;
    afterHide: () => void;
    restoreFocus: () => void;
}

/**
 * Holds the page resources of a Modal-family overlay (its foundation's ModalResources) while `shown`: records the
 * opener, takes the layer, scroll lock and focus, and releases them when `shown` turns false or the host unmounts.
 */
export default function useOverlayResources(foundation: OverlayFoundation, shown: boolean) {
    // records the opener before the layout phase, where an autoFocus element inside the overlay takes focus
    useInsertionEffect(() => {
        if (shown) {
            foundation.recordFocus();
        }
    }, [shown, foundation]);

    useLayoutEffect(() => {
        if (!shown) {
            return undefined;
        }
        foundation.beforeShow();
        return foundation.afterHide;
    }, [shown, foundation]);

    // after the mutation-phase cleanup React refocuses the previously focused element if still in the document (an
    // element of a keepDOM overlay), so restore again in the layout phase
    useDidUpdate(shown, (isShown) => {
        if (!isShown) {
            foundation.restoreFocus();
        }
    });
}
