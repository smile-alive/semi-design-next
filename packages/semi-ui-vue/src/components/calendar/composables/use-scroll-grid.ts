import { type ShallowRef, onMounted, shallowRef, watch } from 'vue';
import { useResizeObserver } from '../../../composables/index';

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
