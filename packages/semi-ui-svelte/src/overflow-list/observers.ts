import type { Attachment } from 'svelte/attachments';
import { SCROLL_KEY_ATTRIBUTE } from '@fibrae/semi-foundation/overflow-list/constants';

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
 * `SCROLL_KEY_ATTRIBUTE` from the observed target. This puts the key on the first element the item renders and reports it
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
            next?.setAttribute(SCROLL_KEY_ATTRIBUTE, key);
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
