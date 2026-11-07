import { type Accessor, createEffect, onCleanup } from 'solid-js';

/**
 * Observes the element `target` returns and follows it when it changes; no element means no observer. Elements that
 * appear after the first render (inside a `Show`) belong in a signal the ref callback writes, since a plain `let`
 * variable is not tracked. `onResize` is called as given, so it reads the latest props itself.
 */
export default function useResizeObserver(target: Accessor<Element | null | undefined>, onResize: (entries: ResizeObserverEntry[]) => void) {
    createEffect(() => {
        const element = target();
        if (!element) {
            return;
        }
        const observer = new ResizeObserver((entries) => onResize(entries));
        observer.observe(element);
        onCleanup(() => observer.disconnect());
    });
}
