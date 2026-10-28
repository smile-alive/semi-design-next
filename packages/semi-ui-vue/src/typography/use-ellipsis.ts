import { onBeforeUnmount, onMounted, watch } from 'vue';
import { EllipsisRuntime } from '@fibrae/semi-foundation/typography/ellipsis';
import useResizeObserver from '../_base/use-resize-observer';

/**
 * Runs `measure` in the next frame after `schedule()`, and again when the width of the root or its parent changes
 * while `enabled()`. Connecting waits for mount so the runtime's ResizeObserver gate counts from the first frame.
 */
export default function useEllipsis(enabled: () => boolean, root: () => HTMLElement | null | undefined, measure: () => void) {
    const runtime = new EllipsisRuntime();
    const widths = new WeakMap<Element, number>();

    const onEntries = (entries: ResizeObserverEntry[]) => {
        let changed = false;
        for (const { target, contentRect } of entries) {
            if (widths.get(target) !== contentRect.width) {
                widths.set(target, contentRect.width);
                changed = true;
            }
        }
        if (changed) runtime.handleResize();
    };

    watch(enabled, (on) => (on ? runtime.connect(measure) : runtime.disconnect()));

    onMounted(() => {
        if (enabled()) runtime.connect(measure);
    });

    onBeforeUnmount(() => runtime.disconnect());

    useResizeObserver(() => (enabled() ? root() : null), onEntries);
    useResizeObserver(() => (enabled() ? root()?.parentElement : null), onEntries);

    return { schedule: () => runtime.schedule() };
}
