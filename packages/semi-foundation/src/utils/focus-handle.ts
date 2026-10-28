import { type FocusableElement, tabbable } from 'tabbable';
import { isHTMLElement } from './dom';

interface HandleOptions {
    enable?: boolean;
    preventScroll?: boolean;
}

export default class FocusTrapHandle {
    #options: HandleOptions;
    #enable: boolean;
    #container: HTMLElement;

    constructor(container: HTMLElement, options?: HandleOptions) {
        // a frozen copy: options cannot change after init, and the caller's own object stays writable
        this.#options = Object.freeze({ ...options });
        this.#container = container;
        this.#enable = options?.enable ?? true;
        this.#container.addEventListener('keydown', this.#onKeyPress);
    }

    #focusElement(element: FocusableElement, event: KeyboardEvent) {
        const { preventScroll } = this.#options;
        element?.focus({ preventScroll });
        event.preventDefault();
    }

    #onKeyPress = (event: KeyboardEvent) => {
        if (event && event.key === 'Tab') {
            const focusableElements = FocusTrapHandle.getFocusableElements(this.#container);
            const focusableNum = focusableElements.length;
            if (focusableNum) {
                if (this.#enable && FocusTrapHandle.getActiveElement(this.#container) === this.#container) {
                    // from the container itself the browser would move on by DOM position, out of the container
                    this.#focusElement(event.shiftKey ? focusableElements.at(-1) : focusableElements[0], event);
                } else if (event.shiftKey) {
                    this.#handleContainerShiftTabKeyDown(focusableElements, event);
                } else {
                    this.#handleContainerTabKeyDown(focusableElements, event);
                }
            }
        }
    };

    #handleContainerTabKeyDown(focusableElements: any[], event: KeyboardEvent) {
        const activeElement = FocusTrapHandle.getActiveElement(this.#container);
        const isLastCurrentFocus = focusableElements.at(-1) === activeElement;

        const redirectForcingElement = focusableElements[0];
        if (this.#enable && isLastCurrentFocus) {
            this.#focusElement(redirectForcingElement, event);
        }
    }

    #handleContainerShiftTabKeyDown(focusableElements: any[], event: KeyboardEvent) {
        const activeElement = FocusTrapHandle.getActiveElement(this.#container);
        const isFirstCurrentFocus = focusableElements[0] === activeElement;
        const redirectForcingElement = focusableElements.at(-1);
        if (this.#enable && isFirstCurrentFocus) {
            this.#focusElement(redirectForcingElement, event);
        }
    }

    static getFocusableElements(node: HTMLElement) {
        // full-native asks checkVisibility without opacity: the default `full` needs layout (jsdom reports every
        // element hidden), and controls at opacity 0 during an overlay's enter animation still take focus
        return isHTMLElement(node) ? tabbable(node, { displayCheck: 'full-native' }) : [];
    }

    /**
     * The focused element as the tree of `scope` sees it, the document without one. Comparing it with nodes of that
     * tree (`contains`, `===`) needs this view: inside a shadow root `document.activeElement` is the host, and the
     * innermost focused element may sit in a nested shadow root the tree's nodes do not contain. `scope` is typed
     * structurally so a React FragmentInstance fits too.
     */
    static getActiveElement(scope?: { getRootNode(): object } | null): HTMLElement | null {
        const root = (scope ?? document).getRootNode() as Partial<DocumentOrShadowRoot>;
        return (root.activeElement ?? null) as HTMLElement | null;
    }

    /**
     * Whether closing `container` may hand focus back to the opener: only when focus is still inside it or nowhere.
     * A non-modal layer leaves focus the user moved elsewhere on the page where it is.
     */
    static shouldRestoreFocus(container: HTMLElement | null | undefined, modal: boolean) {
        const active = FocusTrapHandle.getActiveElement();
        return modal || !active || active === document.body || Boolean(container?.contains(FocusTrapHandle.getActiveElement(container)));
    }

    /** Whether focus is inside `container` and was moved there by the keyboard, so closing it should hand focus back */
    static isFocusVisibleWithin(container?: HTMLElement | null) {
        const active = FocusTrapHandle.getActiveElement(container);
        return Boolean(container && active && container.contains(active) && active.matches(':focus-visible'));
    }

    /** Focuses the first focusable element in `container`, or the container itself when it holds none */
    static focusFirstOrSelf(container?: HTMLElement | null, options?: FocusOptions) {
        const target = container ? (FocusTrapHandle.getFocusableElements(container)[0] ?? container) : undefined;
        target?.focus(options);
    }

    /** The first focusable element marked autofocus; neither the browser nor Vue focuses one that is inserted later */
    static findAutofocus(container: HTMLElement): FocusableElement | undefined {
        return FocusTrapHandle.getFocusableElements(container).find((el) => el.autofocus || el.hasAttribute('autofocus'));
    }

    /**
     * Where a dialog puts focus on open when nothing inside has it: the element focused on the first open, the
     * autofocus element when `autofocus` is set, the footer button named by `initialFocus`, else the first focusable.
     */
    static pickInitialFocus(dialog: HTMLElement, options: { remembered?: HTMLElement | null; footer?: Element | null; initialFocus?: string; autofocus?: boolean }): FocusableElement | undefined {
        const { remembered, footer, initialFocus, autofocus } = options;
        const button = initialFocus ? footer?.querySelector<HTMLElement>(`[data-type="${initialFocus}"]`) : null;
        return (remembered?.isConnected ? remembered : null) ?? (autofocus ? FocusTrapHandle.findAutofocus(dialog) : null) ?? button ?? FocusTrapHandle.getFocusableElements(dialog)[0];
    }

    /** The innermost focused element, inside open shadow roots: the one to focus again later */
    static getDeepActiveElement(): HTMLElement | null {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) {
            active = active.shadowRoot.activeElement;
        }
        return active as HTMLElement | null;
    }

    destroy() {
        this.#container?.removeEventListener('keydown', this.#onKeyPress);
    }
}
