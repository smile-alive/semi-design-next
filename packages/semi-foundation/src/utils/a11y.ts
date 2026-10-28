import { isDev } from './warning';

export function handlePrevent(event: any) {
    event.stopPropagation();
    event.preventDefault();
}

/**
 * Space-separated ids for aria-labelledby and aria-describedby, undefined when there are none; the caller's ids go
 * first, so the Form's ids are added to them instead of replacing them
 */
export function joinIds(...ids: unknown[]): string | undefined {
    return ids.filter((id) => typeof id === 'string' && id !== '').join(' ') || undefined;
}

// the u flag makes one code point one character, so characters outside the BMP count too
function isPrintableCharacter(key: string) {
    return /^\S$/u.test(key);
}

export function setFocusToItem(itemNodes: HTMLElement[], targetItem: HTMLElement) {
    for (let i = 0; i < itemNodes.length; i++) {
        if (itemNodes[i] === targetItem) {
            itemNodes[i].tabIndex = 0;
            itemNodes[i].focus();
        } else {
            itemNodes[i].tabIndex = -1;
        }
    }
}

export function setFocusToFirstItem(itemNodes: HTMLElement[]) {
    if (itemNodes.length > 0) {
        setFocusToItem(itemNodes, itemNodes[0]);
    }
}

export function setFocusToLastItem(itemNodes: HTMLElement[]) {
    if (itemNodes.length > 0) {
        setFocusToItem(itemNodes, itemNodes.at(-1));
    }
}

export interface ListNavigationOptions {
    /** Arrows past either end wrap around instead of staying */
    loop?: boolean;
    /** Which arrows step: Up and Down for a vertical list, Left and Right (swapped in RTL) for a horizontal one */
    orientation?: 'vertical' | 'horizontal';
    rtl?: boolean;
}

/**
 * The item an arrow, Home or End key moves to in a list of `count` items (APG listbox, menu and the rows of a tree),
 * skipping disabled items. From no item (`current` -1) the forward arrow goes to the first item and the backward
 * arrow to the last. Returns null for any other key and for an empty list, and `current` when nothing further is
 * enabled, so a handled key can still prevent the page from scrolling.
 */
export function getListTargetIndex(key: string, current: number, count: number, isDisabled: (index: number) => boolean, { loop = false, orientation = 'vertical', rtl = false }: ListNavigationOptions = {}): number | null {
    if (count === 0) {
        return null;
    }
    const [back, forward] = orientation === 'vertical' ? ['ArrowUp', 'ArrowDown'] : rtl ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight'];
    let start: number;
    let step: number;
    let wrap = loop;
    if (key === 'Home') {
        [start, step, wrap] = [-1, 1, false];
    } else if (key === 'End') {
        [start, step, wrap] = [count, -1, false];
    } else if (key === forward) {
        [start, step] = [current, 1];
    } else if (key === back) {
        [start, step] = [current === -1 ? count : current, -1];
    } else {
        return null;
    }
    let index = start;
    for (let visited = 0; visited < count; visited++) {
        index += step;
        if (index < 0 || index >= count) {
            if (!wrap) {
                break;
            }
            index = (index + count) % count;
        }
        if (!isDisabled(index)) {
            return index;
        }
    }
    return current;
}

/**
 * The enabled item one arrow step from `current` in a list that keeps its highlight outside the DOM (Select,
 * AutoComplete), wrapping at both ends, or -1 when every item is disabled. `current` may be -1 or stale after the
 * list shrank: a forward step then starts at the first item and a backward step at the last.
 */
export function getEnabledStepIndex(offset: number, current: number, count: number, isDisabled: (index: number) => boolean) {
    const key = offset > 0 ? 'ArrowDown' : 'ArrowUp';
    const from = current < 0 || current >= count ? (offset > 0 ? -1 : count) : current;
    const target = getListTargetIndex(key, from, count, isDisabled, { loop: true });
    // with nothing enabled the scan hands `from` back, which may lie outside the list
    return target === null || target < 0 || target >= count || isDisabled(target) ? -1 : target;
}

/** Whether keys on `target` edit text, so they must not type-to-select or activate: a custom search may be any editor */
export function isTextEditor(target: EventTarget | null) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}

/**
 * Whether the event comes from an interactive element inside a trigger (a button, `role="button"` such as a
 * selected tag, link, select, checkbox) rather than from the combobox the trigger acts as. Text fields are not
 * listed: in a trigger one is the search field that drives the list. A control that is the trigger itself or wraps
 * it does not count. The control need not be a DOM descendant, because a React portal inside the trigger (the
 * rest-tags popover) still bubbles its events through it.
 */
export function isInnerControl({ target, currentTarget }: { target: EventTarget | null; currentTarget: EventTarget | null }) {
    const control = target instanceof Element ? target.closest('button, [role="button"], a[href], select, summary, input:is([type="button"], [type="submit"], [type="reset"], [type="image"], [type="checkbox"], [type="radio"])') : null;
    return control !== null && currentTarget instanceof Node && !control.contains(currentTarget);
}

/**
 * Whether the key belongs to an inner control (see `isInnerControl`), so Enter or an arrow on a clear button presses
 * it instead of opening the popup. Escape and Tab keep closing the popup from anywhere.
 */
export function isInnerControlKey(event: { key: string; target: EventTarget | null; currentTarget: EventTarget | null }) {
    return event.key !== 'Escape' && event.key !== 'Tab' && isInnerControl(event);
}

/**
 * The button's half of `isInnerControlKey`: the trigger leaves keys on an inner button alone, and the button keeps
 * the Enter and Space that press it from bubbling to the combobox's onKeyDown or a host's key handler (AutoComplete
 * picks on Enter).
 */
export function stopButtonActivationKeys(event: { key: string; stopPropagation(): void }) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
    }
}

/**
 * Whether a trigger click is an inner control (see `isInnerControl`) activated from the keyboard: Enter and Space on a
 * button or a `role="button"` tag click it without a pointer (detail 0), and that click bubbles to the trigger. The
 * key already belongs to the control, so the trigger must not open or close its popup on it; a pointer click on the
 * same control still does.
 */
export function isInnerControlActivation(event: { detail: number; target: EventTarget | null; currentTarget: EventTarget | null }) {
    return event.detail === 0 && isInnerControl(event);
}

// APG: characters typed within this pause extend the search string
const TYPEAHEAD_PAUSE = 500;

/**
 * Type-to-select for one list (APG listbox, menu, tree): characters typed in quick succession form a search string
 * that the next matching label must start with; typing the same character again cycles through the labels that start
 * with it. Each list keeps its own instance, because the typed string belongs to that list.
 */
export class Typeahead {
    #search = '';
    #lastTyped = 0;

    #isActive() {
        return this.#search !== '' && Date.now() - this.#lastTyped < TYPEAHEAD_PAUSE;
    }

    /**
     * Whether the key event is a character for the search; Space only continues a search, otherwise it activates.
     * Shortcuts (Ctrl, Meta, Alt) never type, so callers cannot forget to filter them.
     */
    accepts({ key, ctrlKey, metaKey, altKey }: Pick<KeyboardEvent, 'key'> & Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey'>>) {
        if (ctrlKey || metaKey || altKey) {
            return false;
        }
        return isPrintableCharacter(key) || (key === ' ' && this.#isActive());
    }

    /**
     * The index of the label the typed characters lead to, or -1 when none matches. An item that cannot be chosen
     * (disabled) passes an empty label.
     */
    match(key: string, labels: string[], current: number) {
        this.#search = this.#isActive() ? this.#search + key.toLowerCase() : key.toLowerCase();
        this.#lastTyped = Date.now();
        const isRepeat = /^(.)\1*$/su.test(this.#search);
        const search = isRepeat ? this.#search[0] : this.#search;
        // a repeated character moves on from the current label; a longer search may stay on it
        const start = current === -1 ? 0 : current + (isRepeat ? 1 : 0);
        for (let i = 0; i < labels.length; i++) {
            const index = (start + i) % labels.length;
            if (labels[index].trim().toLowerCase().startsWith(search)) {
                return index;
            }
        }
        return -1;
    }
}

/**
 * Development-only: warns when a dialog has no accessible name, which screen readers would announce as just
 * "dialog". The name comes from `aria-label` or from the element `aria-labelledby` points at (usually the title).
 */
export function warnIfDialogUnnamed(dialog: HTMLElement | null, component: string) {
    if (!isDev() || !dialog) {
        return;
    }
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const root = dialog.getRootNode() as Document | ShadowRoot;
    const hasLabelElement = labelledBy?.split(/\s+/).some((id) => root.getElementById(id)?.textContent.trim());
    if (!dialog.getAttribute('aria-label')?.trim() && !hasLabelElement) {
        console.warn(`Warning: [Semi ${component}] the dialog has no accessible name. Pass \`title\`, \`aria-label\` or \`aria-labelledby\`.`);
    }
}

/**
 * `root`: the document or shadow root the popup lives in, which also holds its trigger (the popup is portaled into the
 * trigger's root). A token match: a trigger shared by nested popups lists every popup id.
 */
export function getMenuButton(id: string, root: ParentNode): HTMLElement | null {
    return root.querySelector<HTMLElement>(`[data-popupid~="${CSS.escape(id)}"]`);
}
