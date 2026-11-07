import { type Accessor, createEffect, onCleanup, untrack } from 'solid-js';

/**
 * Observes the node `target` returns and follows it when it changes. `onChange` also runs once with no records when
 * observing starts, so the caller reads the initial state there; its reactive reads never restart the observer. Nodes
 * that appear after the first render belong in a signal the ref callback writes, as for `useResizeObserver`.
 */
export default function useMutationObserver(target: Accessor<Node | null | undefined>, onChange: (records: MutationRecord[]) => void, options: MutationObserverInit) {
    createEffect(() => {
        const node = target();
        if (!node) {
            return;
        }
        const observer = new MutationObserver(onChange);
        observer.observe(node, options);
        onCleanup(() => observer.disconnect());
        untrack(() => onChange([]));
    });
}
