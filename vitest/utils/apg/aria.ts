// DOM reading for the pattern checks: roles, names, visibility, tab stops and id references. Approximations that
// need no layout, so they run in jsdom and in a browser alike.

const inputRoles: Record<string, string> = { checkbox: 'checkbox', radio: 'radio', range: 'slider', button: 'button', submit: 'button', reset: 'button' };
const tagRoles: Record<string, string> = { button: 'button', dialog: 'dialog', option: 'option', select: 'combobox', summary: 'button', textarea: 'textbox' };

const nameFromContent = new Set(['button', 'checkbox', 'heading', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'switch', 'tab', 'treeitem']);

const focusable = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable=false])';

const referenceAttributes = ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-activedescendant', 'aria-owns'];

export function roleOf(el: Element): string {
    const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0];
    if (explicit) {
        return explicit;
    }
    const tag = el.localName;
    if (tag === 'input') {
        return inputRoles[(el as HTMLInputElement).type] ?? 'textbox';
    }
    if (tag === 'a') {
        return el.hasAttribute('href') ? 'link' : '';
    }
    return /^h[1-6]$/.test(tag) ? 'heading' : (tagRoles[tag] ?? '');
}

export const ids = (el: Element, attribute: string) => (el.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);

export const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The element an id reference names, looked up in the document or shadow root `el` lives in, as ARIA resolves it. */
export function byId(el: Element, id: string) {
    return (el.getRootNode() as Document | ShadowRoot).getElementById?.(id) ?? null;
}

export function accessibleName(el: Element) {
    const referenced = ids(el, 'aria-labelledby').flatMap((id) => byId(el, id) ?? []);
    if (referenced.length) {
        return referenced.map(textOf).join(' ');
    }
    const label = el.getAttribute('aria-label')?.trim();
    if (label) {
        return label;
    }
    const labels = (el as HTMLInputElement).labels;
    if (labels?.length) {
        return [...labels].map(textOf).join(' ');
    }
    if (nameFromContent.has(roleOf(el)) && textOf(el)) {
        return textOf(el);
    }
    return el.getAttribute('title')?.trim() ?? '';
}

/** A short label for a problem report: role, accessible name or id, falling back to the tag. */
export function describe(el: Element | null | undefined) {
    if (!el) {
        return 'nothing';
    }
    if (el === el.ownerDocument.body) {
        return 'body';
    }
    const name = accessibleName(el).slice(0, 24);
    const parts = [roleOf(el) || el.localName, name && `"${name}"`, el.id && `#${el.id}`];
    return parts.filter(Boolean).join(' ');
}

const renderedParent = (el: Element) => el.parentElement ?? (el.parentNode as ShadowRoot | null)?.host ?? null;

/** Not rendered for anyone: detached, `hidden`, `inert` or `display: none` on the element or an ancestor. */
export function isGone(el: Element) {
    if (!el.isConnected) {
        return true;
    }
    for (let node: Element | null = el; node; node = renderedParent(node)) {
        if (node.hasAttribute('hidden') || node.hasAttribute('inert') || getComputedStyle(node).display === 'none') {
            return true;
        }
    }
    return false;
}

/** Rendered but hidden from assistive technology, so focus must never land in it. */
export const isUnreachable = (el: Element) => !!el.closest('[aria-hidden="true"], [inert]');

export const isDisabled = (el: Element) => el.getAttribute('aria-disabled') === 'true' || el.matches(':disabled');

/** Every element under `scope` with one of `roles`, in document order; `includeHidden` keeps what styles hide, like a collapsed branch. */
export function withRole(scope: Element, roles: string[], includeHidden = false) {
    return [...scope.querySelectorAll('*')].filter((el) => roles.includes(roleOf(el)) && (includeHidden || !isGone(el)));
}

/** A checked state as a screen reader reads it: aria-checked, or a native input's `checked`. */
export function checkedOf(el: Element) {
    return el instanceof HTMLInputElement && !el.hasAttribute('aria-checked') ? String(el.checked) : (el.getAttribute('aria-checked') ?? '');
}

function isTabStop(el: Element) {
    if (!el.matches(focusable) || isGone(el) || (el as HTMLElement).tabIndex < 0 || el.matches(':disabled')) {
        return false;
    }
    if (el instanceof HTMLInputElement && el.type === 'hidden') {
        return false;
    }
    // Native radios that share a name are one stop: the checked one, else the first
    if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
        const group = [...el.ownerDocument.querySelectorAll<HTMLInputElement>('input[type=radio]')].filter((radio) => radio.name === el.name && radio.form === el.form && !isGone(radio));
        return el === (group.find((radio) => radio.checked) ?? group[0]);
    }
    return true;
}

/** The elements in `scope`, itself included, that Tab stops at. */
export function tabStops(scope: Element) {
    return [scope, ...scope.querySelectorAll(focusable)].filter(isTabStop);
}

/** The elements under `scope` that take focus by Tab or by script, like roving items. */
export function focusables(scope: Element) {
    return [...scope.querySelectorAll(focusable)].filter((el) => !isGone(el) && !el.matches(':disabled') && !(el instanceof HTMLInputElement && el.type === 'hidden'));
}

export function isEditable(el: Element) {
    return el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !/^(button|checkbox|radio|submit|reset|range|color|file|image)$/.test(el.type)) || (el as HTMLElement).isContentEditable;
}

/** document.activeElement, followed into open shadow roots. */
export function deepActiveElement(doc: Document) {
    let active = doc.activeElement;
    while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
    }
    return active;
}

/** The id references under `scope` that name nothing. */
export function danglingReferences(scope: Element) {
    const dangling: { el: Element; attribute: string; id: string }[] = [];
    for (const el of [scope, ...scope.querySelectorAll('*')]) {
        if (isGone(el)) {
            continue;
        }
        for (const attribute of referenceAttributes) {
            // axe allows a collapsed or unselected control to point at a popup or panel that is not rendered
            if (attribute === 'aria-controls' && (el.getAttribute('aria-expanded') === 'false' || el.getAttribute('aria-selected') === 'false')) {
                continue;
            }
            for (const id of ids(el, attribute)) {
                if (!byId(el, id)) {
                    dangling.push({ el, attribute, id });
                }
            }
        }
    }
    return dangling;
}
