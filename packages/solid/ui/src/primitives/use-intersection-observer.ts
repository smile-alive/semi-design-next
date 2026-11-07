import { type Accessor, createEffect, onCleanup } from 'solid-js';

/**
 * Rebuilds the observer when `targets` or `options` change; no targets means no observer. Targets compare by array
 * identity, so pass a new array to observe the same elements again (an img given a new src). Elements read from
 * untracked DOM (rendered children) belong in a signal the caller writes after mount, since the effect only follows
 * the accessors.
 */
export default function useIntersectionObserver(targets: Accessor<readonly Element[]>, callback: IntersectionObserverCallback, options: Accessor<IntersectionObserverInit> = () => ({})) {
    createEffect(() => {
        const elements = targets();
        const init = options();
        if (!elements.length) {
            return;
        }
        const observer = new IntersectionObserver((entries, self) => callback(entries, self), init);
        for (const element of elements) observer.observe(element);
        onCleanup(() => observer.disconnect());
    });
}
