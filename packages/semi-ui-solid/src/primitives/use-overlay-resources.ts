import { type Accessor, createEffect, onCleanup, untrack } from 'solid-js';
import useRecordFocus from './use-record-focus';

interface OverlayFoundation {
    recordFocus: () => void;
    beforeShow: () => void;
    afterHide: () => void;
}

/**
 * Holds the page resources of a Modal-family overlay (its foundation's ModalResources): records the opener when
 * `visible` turns true, takes the layer, scroll lock and focus while `shown`, and releases them when `shown` turns
 * false or the owner is disposed. `shown` is the host's own gate for a dialog that is in the document; the signals it
 * reads are the only ones tracked.
 */
export default function useOverlayResources(foundation: OverlayFoundation, visible: Accessor<boolean | undefined>, shown: Accessor<boolean>) {
    useRecordFocus({ record: foundation.recordFocus }, visible);

    createEffect(() => {
        if (!shown()) {
            return;
        }
        untrack(foundation.beforeShow);
        onCleanup(foundation.afterHide);
    });
}
