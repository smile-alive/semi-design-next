import { onMount } from 'svelte';
import { observeResize } from '../resize-observer/index.js';

/**
 * The scrolling time grid shared by the day, week and range views: measures the grid height events are placed
 * against and applies the initial `scrollTop` on mount. A grid mounted inside a hidden container (an inactive
 * Tabs pane) measures 0, so the height is measured again when it resizes (`observe`, attached to the scroll element),
 * and the initial `scrollTop` is applied once more the first time it becomes visible.
 */
export default function useScrollGrid(root: () => HTMLElement | undefined, scroll: () => HTMLElement | undefined, scrollTop: () => number) {
    let scrollHeight = $state(0);

    // `scrollTop` is applied once when the grid first gets a height; later resizes must not pull the user's position back
    let awaitingHeight = false;

    const applyScrollTop = () => {
        const element = root();
        if (element) {
            element.scrollTop = scrollTop();
        }
    };

    const measure = () => {
        scrollHeight = scroll()?.scrollHeight ?? 0;
        if (awaitingHeight && scrollHeight > 0) {
            awaitingHeight = false;
            applyScrollTop();
        }
    };

    onMount(() => {
        measure();
        applyScrollTop();
        awaitingHeight = scrollHeight === 0;
    });

    return { scrollHeight: () => scrollHeight, observe: observeResize(measure) };
}
