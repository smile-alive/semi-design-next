import { type MaybeRefOrGetter, toValue, watchEffect } from 'vue';

export default function useResizeObserver(target: MaybeRefOrGetter<Element | null | undefined>, onResize: (entries: ResizeObserverEntry[]) => void) {
    watchEffect(
        (cleanup) => {
            const element = toValue(target);
            if (!element) {
                return;
            }
            const observer = new ResizeObserver(onResize);
            observer.observe(element);
            cleanup(() => observer.disconnect());
        },
        { flush: 'post' }
    );
}
