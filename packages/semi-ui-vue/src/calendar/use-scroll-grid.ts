import { type ShallowRef, onMounted, shallowRef, watch } from 'vue';
import useResizeObserver from '../_base/use-resize-observer';

/**
 * The scrolling time grid shared by the day, week and range views: measures the grid height events are placed
 * against and applies the initial `scrollTop` on mount. A grid mounted inside a hidden container (an inactive
 * Tabs pane) measures 0, so the height is measured again when it resizes, and the initial `scrollTop` is applied
 * once more the first time it becomes visible.
 */
export default function useScrollGrid(root: Readonly<ShallowRef<HTMLElement | null>>, scroll: Readonly<ShallowRef<HTMLElement | null>>, scrollTop: () => number): Readonly<ShallowRef<number>> {
    const scrollHeight = shallowRef(0);

    const measure = () => {
        scrollHeight.value = scroll.value?.scrollHeight ?? 0;
    };

    const applyScrollTop = () => {
        if (root.value) {
            root.value.scrollTop = scrollTop();
        }
    };

    onMounted(() => {
        measure();
        applyScrollTop();
        // Mounted in a hidden container (height 0): apply once when it first gets a height. `once` so later
        // resizes cannot pull the user's scroll position back.
        if (scrollHeight.value === 0) {
            watch(scrollHeight, applyScrollTop, { once: true, flush: 'post' });
        }
    });

    useResizeObserver(scroll, measure);

    return scrollHeight;
}
