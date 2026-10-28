import { type Accessor, createComputed } from 'solid-js';
import { isServer } from 'solid-js/web';

/**
 * Records the focused element each time `visible` turns true. A computed runs before the DOM updates, wherever it is
 * created, so the opener is recorded before the overlay's content is inserted and an element inside takes focus. The
 * server has no focus to record.
 */
export default function useRecordFocus(scope: { record: () => void }, visible: Accessor<boolean | undefined>) {
    if (isServer) {
        return;
    }
    createComputed(() => {
        if (visible()) {
            scope.record();
        }
    });
}
