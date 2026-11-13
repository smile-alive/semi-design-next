import { watch } from 'vue';
import useRecordFocus from './use-record-focus';

interface OverlayFoundation {
    recordFocus: () => void;
    beforeShow: () => void;
    afterHide: () => void;
}

/**
 * Holds the page resources of a Modal-family overlay (its foundation's ModalResources): records the opener when
 * `visible` turns true, takes the layer, scroll lock and focus while `shown`, and releases them when `shown` turns
 * false or the component unmounts. `shown` is the host's own gate for a dialog that is in the document and displayed.
 */
export default function useOverlayResources(foundation: OverlayFoundation, visible: () => boolean | undefined, shown: () => boolean) {
    useRecordFocus({ record: foundation.recordFocus }, visible);

    watch(
        shown,
        (isShown, _, onCleanup) => {
            if (!isShown) return;
            foundation.beforeShow();
            onCleanup(foundation.afterHide);
        },
        { flush: 'post' }
    );
}
