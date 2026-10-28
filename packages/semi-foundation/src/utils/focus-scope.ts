import { getMenuButton } from './a11y';
import FocusTrapHandle from './focus-handle';

// the element may sit in a shadow root inside the popup (a third-party control), which closest() does not leave
function closestPopup(element: Element | null) {
    for (let current = element; current; current = (current.getRootNode() as Partial<ShadowRoot>).host ?? null) {
        const popup = current.closest('[popover][id]');
        if (popup) {
            return popup;
        }
    }
    return null;
}

/**
 * The triggers of the Tooltip-family popups around `element`, innermost first. Relies on the D5 markup: the popup is a
 * `[popover]` whose id its trigger names in `data-popupid`.
 */
function popupTriggers(element: Element | null) {
    const triggers: HTMLElement[] = [];
    for (let popup = closestPopup(element); popup;) {
        const trigger = getMenuButton(popup.id, popup.getRootNode() as ParentNode);
        if (!trigger) {
            break;
        }
        triggers.push(trigger);
        popup = closestPopup(trigger);
    }
    return triggers;
}

const canTakeFocus = (element: HTMLElement | null) => element?.isConnected && !element.matches(':disabled') && element.checkVisibility();

/**
 * Focus handling of a modal overlay (APG dialog pattern): remember the focused element when the overlay opens, move
 * focus into the overlay, keep Tab inside it, and return focus when it closes. The steps are separate because their
 * timing is the component's: an element inside the overlay may take focus (autoFocus) between `record` and
 * `activate`, and `restore` may run more than once for one close.
 */
export default class FocusScope {
    #container: HTMLElement | null = null;
    #trap: FocusTrapHandle | null = null;
    #previous: HTMLElement | null = null;
    // an element in a menu or popover is usually gone by the time the overlay closes (the popup closed on the click
    // that opened the overlay); its triggers are the next places to return to
    #fallbacks: HTMLElement[] = [];

    /** Remembers the focused element to return to; a re-activation finds the focus already inside and keeps the first */
    record() {
        const active = FocusTrapHandle.getDeepActiveElement();
        if (!this.#container?.contains(FocusTrapHandle.getActiveElement(this.#container))) {
            this.#previous = active;
            this.#fallbacks = popupTriggers(active);
        }
    }

    /** Traps Tab in `container` and focuses it, unless an element inside already took focus */
    activate(container: HTMLElement, preventScroll?: boolean) {
        this.#trap?.destroy();
        this.#trap = new FocusTrapHandle(container, { preventScroll });
        this.enter(container, preventScroll);
    }

    /** Focuses `container` without trapping Tab, for a non-modal overlay; an element inside may already have focus */
    enter(container: HTMLElement, preventScroll?: boolean) {
        this.#container = container;
        if (!container.contains(FocusTrapHandle.getActiveElement(container))) {
            container.focus({ preventScroll });
        }
        // a container without tabIndex cannot take focus itself
        if (!container.contains(FocusTrapHandle.getActiveElement(container))) {
            FocusTrapHandle.getFocusableElements(container)[0]?.focus({ preventScroll });
        }
    }

    /** `activate` for a modal overlay, `enter` for a non-modal one */
    engage(container: HTMLElement, modal: boolean, preventScroll?: boolean) {
        if (modal) {
            this.activate(container, preventScroll);
        } else {
            this.enter(container, preventScroll);
        }
    }

    deactivate() {
        this.#trap?.destroy();
        this.#trap = null;
    }

    /** Focuses the recorded element again; call it after the inert around the overlay is released */
    restore(preventScroll?: boolean) {
        [this.#previous, ...this.#fallbacks].find(canTakeFocus)?.focus({ preventScroll });
    }

    /**
     * `restore` unless the user moved focus out of a non-modal `container` (see `FocusTrapHandle.shouldRestoreFocus`).
     * `container` is passed in rather than read from `enter`, which may not have run for this close.
     */
    restoreIfAllowed(container: HTMLElement | null | undefined, modal: boolean, preventScroll?: boolean) {
        if (FocusTrapHandle.shouldRestoreFocus(container, modal)) {
            this.restore(preventScroll);
        }
    }
}
