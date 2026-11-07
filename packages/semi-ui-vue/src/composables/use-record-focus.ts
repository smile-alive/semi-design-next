import { onBeforeMount, watch } from 'vue';

/**
 * Records the focused element each time `visible` turns true, before anything inside the overlay takes focus.
 * The first render is covered by onBeforeMount, not an immediate watcher: the latter also runs on the server, where
 * there is no document.
 */
export default function useRecordFocus(scope: { record: () => void }, visible: () => boolean | undefined) {
    watch(visible, (value) => {
        if (value) scope.record();
    });

    onBeforeMount(() => {
        if (visible()) scope.record();
    });
}
