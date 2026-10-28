import { isHTMLElement } from './dom';
import FocusTrapHandle from './focus-handle';

/**
 * The tabbable element a keyboard user would reach next after `from` is removed: the first one after it in document
 * order, else the last one before it. Read it before the removal, while `from` still has a position.
 */
export function findFocusAfter(from: Element): HTMLElement | null {
    // shortcut: inside a shadow root only descendants of its top-level children are searched, so a tabbable direct
    // child of the shadow root is skipped; switch to tabbable(root.host, { getShadowRoot }) if that layout must hand focus over.
    const root = from.getRootNode();
    const scopes = root instanceof ShadowRoot ? [...root.children] : [document.body];
    const tabbables = scopes.flatMap((scope) => FocusTrapHandle.getFocusableElements(scope as HTMLElement)).filter((node): node is HTMLElement => isHTMLElement(node) && !from.contains(node));
    return tabbables.find((node) => from.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) ?? tabbables.at(-1) ?? null;
}

/**
 * Moves focus to `target` once `from`, the element that held focus, has left the document and nothing else took
 * focus: removing a focused node drops focus to the body, and keyboard users restart from the top of the page
 * (WCAG 2.4.3). A handler that moved focus on purpose keeps it.
 */
export function handoverFocus(from: Element, target?: HTMLElement | null) {
    const active = document.activeElement;
    if (!from.isConnected && (active === null || active === document.body)) {
        target?.focus();
    }
}
