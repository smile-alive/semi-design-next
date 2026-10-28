import { createSignal, onMount, untrack } from 'solid-js';
import useResizeObserver from '../_base/use-resize-observer';

/**
 * The scrolling time grid shared by the day, week and range views: measures the grid height events are placed
 * against and applies the initial `scrollTop`. A grid mounted in a hidden container (an inactive Tabs pane) measures
 * 0 and cannot scroll, so both are redone once it becomes visible.
 */
export default function useScrollGrid(scrollTop: () => number) {
    const [root, setRoot] = createSignal<HTMLElement>();
    const [scroll, setScroll] = createSignal<HTMLElement>();
    const [scrollHeight, setScrollHeight] = createSignal(0);

    // the scroll position is read when it is applied, not tracked
    const applyScrollTop = () => {
        const element = root();
        if (element) {
            element.scrollTop = untrack(scrollTop);
        }
    };

    // the write is lost while the grid has no layout box
    let scrollPending = false;

    onMount(() => {
        const height = scroll()?.scrollHeight ?? 0;
        setScrollHeight(height);
        applyScrollTop();
        scrollPending = height === 0;
    });

    useResizeObserver(scroll, () => {
        const height = scroll()?.scrollHeight ?? 0;
        setScrollHeight(height);
        if (scrollPending && height > 0) {
            scrollPending = false;
            applyScrollTop();
        }
    });

    return { rootRef: (element: HTMLElement) => setRoot(element), scrollRef: (element: HTMLElement) => setScroll(element), scrollHeight };
}
