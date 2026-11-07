import { openLayer } from '../utils/layer';
import { lockBodyScroll } from '../utils/scroll-lock';
import FocusScope from './focus-scope';
import ReleaseHolder from './release-holder';

export interface ModalHold {
    /** Modal: the page outside is inert, Tab stays inside, focus returns even if the user moved it elsewhere */
    modal: boolean;
    /** The overlay's outermost element, put on the overlay stack (utils/layer); without it the overlay stays off the stack */
    layer?: HTMLElement | null;
    /** Receives Escape while the overlay is the top layer that wants it; returns whether it handled the key */
    onEscape?: (e: KeyboardEvent) => boolean;
    /** Locks body scroll; `modal` by default */
    lockScroll?: boolean;
    /** The element focus moves into, Tab-trapped when modal; `release` returns focus only for a hold with one */
    focus?: HTMLElement | null;
    preventScroll?: boolean;
}

/**
 * The page-level resources an overlay holds while it is shown (Modal, SideSheet, ImagePreview, UserGuide): its place on
 * the overlay stack, the body scroll lock and its focus (FocusScope). A foundation owns one and decides `modal` once;
 * the host only hands over the elements.
 */
export default class ModalResources {
    readonly #scroll = new ReleaseHolder();
    readonly #layer = new ReleaseHolder();
    readonly #focus = new FocusScope();
    // kept after release: a host whose framework refocuses an element after the close returns focus again
    #last: ModalHold | null = null;
    #held = false;

    /** Remembers the focused element to return to; call it before anything inside the overlay may take focus */
    record = () => {
        this.#focus.record();
    };

    /** Takes the resources `hold` asks for; holding again replaces the previous hold */
    hold(hold: ModalHold) {
        this.#last = hold;
        this.#held = true;
        if (hold.lockScroll ?? hold.modal) {
            this.#scroll.hold(lockBodyScroll);
        } else {
            this.#scroll.release();
        }
        if (hold.layer) {
            const { layer, modal, onEscape } = hold;
            this.#layer.hold(() => openLayer({ element: layer, modal, onEscape }));
        } else {
            this.#layer.release();
        }
        if (hold.focus) {
            this.#focus.engage(hold.focus, hold.modal, hold.preventScroll);
        }
    }

    /**
     * The reverse of `hold`; idempotent. The layer goes before focus returns: it releases the page's inert, and an
     * inert element cannot take focus.
     */
    release() {
        if (!this.#held) {
            return;
        }
        this.#held = false;
        this.#layer.release();
        this.#scroll.release();
        this.#focus.deactivate();
        if (this.#last?.focus) {
            this.restoreFocus();
        }
    }

    /**
     * Returns focus to the recorded element, unless the user moved it out of a non-modal overlay; `container` is the
     * overlay's focus element, the last hold's by default.
     */
    restoreFocus(container: HTMLElement | null | undefined = this.#last?.focus) {
        this.#focus.restoreIfAllowed(container, this.#last?.modal ?? false, this.#last?.preventScroll);
    }
}
