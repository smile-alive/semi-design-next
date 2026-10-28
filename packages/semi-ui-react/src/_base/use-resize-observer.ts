import { type RefObject, useEffectEvent, useLayoutEffect } from 'react';

type Target = Element | RefObject<Element | null> | null;

interface Options {
    /** false stops observing, true observes again */
    enabled?: boolean;
}

/**
 * Observes `target` while `enabled`, and stops on unmount; `onResize` sees the latest render's values. A ref target is
 * read when the effect runs, so it must point at an element that stays for the component's lifetime; pass the element
 * itself (kept in state) when it can change.
 */
export default function useResizeObserver(target: Target, onResize: (entries: ResizeObserverEntry[]) => void, { enabled = true }: Options = {}) {
    const handle = useEffectEvent(onResize);

    useLayoutEffect(() => {
        const node = target instanceof Element ? target : target?.current;
        if (!enabled || !node) {
            return undefined;
        }
        const observer = new ResizeObserver((entries) => handle(entries));
        observer.observe(node);
        return () => observer.disconnect();
    }, [target, enabled]);
}
