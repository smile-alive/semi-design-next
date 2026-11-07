import type { Attachment } from 'svelte/attachments';

/** `onResize` is called with the first size too, as the browser reports it on `observe()`. */
export default function observeResize(onResize: (entries: ResizeObserverEntry[]) => void): Attachment<Element> {
    return (element) => {
        const observer = new ResizeObserver(onResize);
        observer.observe(element);
        return () => observer.disconnect();
    };
}
