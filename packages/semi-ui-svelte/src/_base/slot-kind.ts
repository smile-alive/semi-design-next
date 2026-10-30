import type { Attachment } from 'svelte/attachments';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';

export type SlotKind = 'text' | 'icon' | 'node';

// A snippet exposes nothing to read before it renders, so the kind comes from the rendered nodes: a lone text node, a lone
// Semi icon, or anything else. Shortcut: the kind class appears after mount, so the server HTML lacks it; upgrade by
// letting the slot props accept a string for the text case when the first-frame margin matters.
export function getSlotKind(container: Element): SlotKind | undefined {
    const nodes = [...container.childNodes].filter((node) => node.nodeType !== Node.COMMENT_NODE && !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()));
    if (nodes.length === 0) {
        return undefined;
    }
    if (nodes.length > 1) {
        return 'node';
    }
    const [node] = nodes;
    if (node.nodeType === Node.TEXT_NODE) {
        return 'text';
    }
    // nodeType rather than instanceof: the slot may sit in another document, whose Element differs from this realm's
    return (node as Element).classList?.contains(`${BASE_CLASS_PREFIX}-icon`) ? 'icon' : 'node';
}

/** Reports the slot kind of the element's content after mount and whenever its child nodes change */
export function trackSlotKind(report: (kind?: SlotKind) => void): Attachment<Element> {
    return (container) => {
        const update = () => report(getSlotKind(container));
        update();
        const observer = new MutationObserver(update);
        observer.observe(container, { childList: true });
        return () => observer.disconnect();
    };
}
