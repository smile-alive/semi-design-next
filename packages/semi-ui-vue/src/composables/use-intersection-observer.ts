import { type MaybeRefOrGetter, onMounted, toValue, watch } from 'vue';

/**
 * Rebuilds the observer when the targets or options change; no targets means no observer. Targets compare by array,
 * not by element: pass a new array to observe the same elements again (an img given a new data-src), keep the array to
 * avoid a rebuild. A getter reruns only when its reactive reads change, so targets read from untracked DOM (slot
 * output) belong in a ref the caller assigns. Created on mount so server render reads no DOM and getters may query the
 * rendered tree.
 */
export default function useIntersectionObserver(targets: MaybeRefOrGetter<readonly Element[]>, callback: IntersectionObserverCallback, options: MaybeRefOrGetter<IntersectionObserverInit> = {}) {
    onMounted(() =>
        watch(
            [() => toValue(targets), () => toValue(options)],
            ([elements, init], _, onCleanup) => {
                if (!elements.length) return;
                const observer = new IntersectionObserver(callback, init);
                for (const element of elements) observer.observe(element);
                onCleanup(() => observer.disconnect());
            },
            { immediate: true, flush: 'post' }
        )
    );
}
