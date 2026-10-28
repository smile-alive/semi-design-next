import { type MaybeRefOrGetter, onMounted, toValue, watch } from 'vue';

/**
 * `onChange` also runs once with no records when observing starts, so the caller reads the initial state there; its
 * reactive reads never restart the observer. Created on mount so server render and hydration read no DOM, and the
 * first run happens within the mount.
 */
export default function useMutationObserver(target: MaybeRefOrGetter<Node | null | undefined>, onChange: (records: MutationRecord[]) => void, options: MutationObserverInit) {
    onMounted(() =>
        watch(
            () => toValue(target),
            (node, _, onCleanup) => {
                if (!node) return;
                const observer = new MutationObserver(onChange);
                observer.observe(node, options);
                onCleanup(() => observer.disconnect());
                onChange([]);
            },
            { immediate: true, flush: 'post' }
        )
    );
}
