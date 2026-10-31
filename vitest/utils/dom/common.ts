import type { MockInstance } from 'vite-plus/test';

/**
 * jsdom runs no CSS animations, so a popup leaving with motion waits for an animationend that never comes.
 * Call inside `waitFor` before asserting the popup is gone.
 */
export function endLeaveAnimations() {
    document.querySelectorAll('[class*="-animation-hide"]').forEach((el) => el.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true })));
}

// ARIA 1.2 roles that support aria-required; axe reports it on any other role as aria-allowed-attr
const ARIA_REQUIRED_ROLES = new Set(['checkbox', 'columnheader', 'combobox', 'gridcell', 'listbox', 'radiogroup', 'rowheader', 'searchbox', 'spinbutton', 'switch', 'textbox', 'tree', 'treegrid']);
const INPUT_ROLES: Record<string, string> = { checkbox: 'checkbox', radio: 'radio', number: 'spinbutton', range: 'slider', search: 'searchbox', button: 'button', submit: 'button', reset: 'button', file: 'none', hidden: 'none' };

function roleOf(element: Element) {
    const role = element.getAttribute('role');
    if (role) {
        return role;
    }
    if (element instanceof HTMLInputElement) {
        return INPUT_ROLES[element.type] ?? 'textbox';
    }
    return { TEXTAREA: 'textbox', SELECT: 'combobox' }[element.tagName] ?? element.tagName.toLowerCase();
}

/** The roles under `root` that carry aria-required="true" without supporting it */
export function misplacedAriaRequired(root: ParentNode = document) {
    return [...root.querySelectorAll('[aria-required="true"]')].map(roleOf).filter((role) => !ARIA_REQUIRED_ROLES.has(role));
}

type ListenerSpy = MockInstance<EventTarget['addEventListener']>;

/**
 * Counts the `type` listeners recorded by spies on addEventListener and removeEventListener that are still attached:
 * a listener goes away through removeEventListener or by aborting the signal it was added with.
 */
export function countLiveListeners(add: ListenerSpy, remove: ListenerSpy, type: string) {
    const removed = new Set(remove.mock.calls.filter(([name]) => name === type).map(([, listener]) => listener));
    return add.mock.calls.filter(([name, listener, options]) => name === type && !removed.has(listener) && !(typeof options === 'object' && options.signal?.aborted)).length;
}
