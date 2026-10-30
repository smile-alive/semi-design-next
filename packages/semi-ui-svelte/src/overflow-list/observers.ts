import type { Attachment } from 'svelte/attachments';

/**
 * Reports the element's own size. Attached with a stable expression: a new attachment per render would observe again,
 * report the initial size again, and the measurement would re-render forever.
 */
export function observeSize(onResize: (entry: ResizeObserverEntry) => void): Attachment<HTMLElement> {
    return (element) => {
        const observer = new ResizeObserver(([entry]) => onResize(entry));
        observer.observe(element);
        return () => observer.disconnect();
    };
}

/**
 * Scroll mode wraps an item in a marker element (`display: contents`, it has no box to observe) and the foundation reads
 * `data-scrollkey` from the observed target. This puts the key on the first element the item renders and reports it
 * (null when it goes away), also when the item swaps that element.
 */
export function markScrollItem(key: string, onElement: (element: Element | null) => void): Attachment<HTMLElement> {
    return (marker) => {
        let current: Element | null = null;
        const sync = () => {
            const next = marker.firstElementChild;
            if (next === current) {
                return;
            }
            next?.setAttribute('data-scrollkey', key);
            current = next;
            onElement(next);
        };
        sync();
        const mutations = new MutationObserver(sync);
        mutations.observe(marker, { childList: true });
        return () => {
            mutations.disconnect();
            onElement(null);
        };
    };
}
