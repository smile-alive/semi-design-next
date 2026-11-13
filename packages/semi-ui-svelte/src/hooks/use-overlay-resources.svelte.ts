import { untrack } from 'svelte';

interface OverlayFoundation {
    recordFocus: () => void;
    beforeShow: () => void;
    afterHide: () => void;
}

/**
 * Holds the page resources of a Modal-family overlay (its foundation's ModalResources): records the opener when
 * `visible` turns true, before the DOM updates and anything inside takes focus in its mount effects; takes the layer,
 * scroll lock and focus while `shown`, and releases them when `shown` turns false or the component is destroyed.
 * `shown` is the host's own gate for a dialog that is in the document and displayed.
 */
export default function useOverlayResources(foundation: OverlayFoundation, visible: () => boolean | undefined, shown: () => boolean) {
    $effect.pre(() => {
        if (visible()) {
            untrack(foundation.recordFocus);
        }
    });

    $effect(() => {
        if (!shown()) return;
        untrack(foundation.beforeShow);
        return foundation.afterHide;
    });
}
