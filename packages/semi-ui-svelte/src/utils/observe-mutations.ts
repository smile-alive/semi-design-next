import type { Attachment } from 'svelte/attachments';

/** `onChange` also runs once with no records when the element attaches, so the caller reads the initial state there. */
export default function observeMutations<T extends Node>(onChange: (node: T, records: MutationRecord[]) => void, options: MutationObserverInit): Attachment<T> {
    return (node) => {
        onChange(node, []);
        const observer = new MutationObserver((records) => onChange(node, records));
        observer.observe(node, options);
        return () => observer.disconnect();
    };
}
