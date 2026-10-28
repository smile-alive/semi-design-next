import { useEffectEvent, useLayoutEffect } from 'react';

/**
 * Observes the elements `getTargets` returns against the viewport, and builds a new observer after each commit in which
 * `targetsKey` or an option changed; no targets means no observer. `getTargets` runs after the commit, so it may query
 * the rendered tree, and both functions see the latest render's values. `targetsKey` stands for the observed elements:
 * change it whenever they must be observed again, including the same elements an earlier callback unobserved.
 */
export default function useIntersectionObserver(getTargets: () => Iterable<Element>, callback: IntersectionObserverCallback, { rootMargin, threshold }: { rootMargin?: string; threshold?: number }, targetsKey: unknown) {
    const readTargets = useEffectEvent(getTargets);
    const handle = useEffectEvent(callback);

    useLayoutEffect(() => {
        const elements = [...readTargets()];
        if (!elements.length) {
            return undefined;
        }
        const observer = new IntersectionObserver((entries, self) => handle(entries, self), { root: null, rootMargin, threshold });
        for (const element of elements) observer.observe(element);
        return () => observer.disconnect();
    }, [targetsKey, rootMargin, threshold]);
}
