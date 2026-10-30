import type { Attachment } from 'svelte/attachments';

/**
 * Reports the size changes of the element it is attached to (`<div {@attach observeResize(onResize)}>`). An attachment
 * rather than a component or a target-getter hook: Svelte hands it the element and runs the cleanup on removal, so no
 * `bind:this` state is needed. `onResize` is called with the first size too, as the browser reports it on `observe()`.
 */
export default function observeResize(onResize: (entries: ResizeObserverEntry[]) => void): Attachment<Element> {
    return (element) => {
        const observer = new ResizeObserver(onResize);
        observer.observe(element);
        return () => observer.disconnect();
    };
}
