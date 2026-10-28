import FocusTrapHandle from '../utils/focus-handle';
import { cssClasses } from './constants';

const tagCls = cssClasses.PREFIX;

function isReachableTag(node: Element): node is HTMLElement {
    return node instanceof HTMLElement && node.matches(`.${tagCls}:not(.${tagCls}-invisible)`) && node.tabIndex >= 0;
}

/** Prefers the following tag, falling back to the preceding one. */
function findAdjacentTag(tag: Element): HTMLElement | null {
    for (let node = tag.nextElementSibling; node; node = node.nextElementSibling) {
        if (isReachableTag(node)) {
            return node;
        }
    }
    for (let node = tag.previousElementSibling; node; node = node.previousElementSibling) {
        if (isReachableTag(node)) {
            return node;
        }
    }
    return null;
}

/**
 * Called once a tag's close is confirmed and before it hides or unmounts: a hidden or removed tag drops focus to the
 * body, so a focused tag that is closing hands it to its neighbour first (WCAG 2.4.3). `from` is the tag or any
 * element inside it.
 */
export function moveFocusToAdjacentTag(from: Element) {
    const tag = from.closest(`.${tagCls}`);
    if (tag && tag === FocusTrapHandle.getActiveElement(tag)) {
        findAdjacentTag(tag)?.focus();
    }
}
