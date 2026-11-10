import FocusTrapHandle from '../../base/focus-handle';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import ModalResources from '../../base/modal-resources';
import { cssClasses } from './constants';
import type { ModalProps } from './modal-foundation';

export interface ModalContentProps extends Omit<ModalProps, 'getPopupContainer'> {
    /** Whether the dialog renders into body rather than a custom container; Modal resolves it once per render */
    inBody: boolean;
    /** The default footer button (its `data-type`) focused on opening when nothing inside the dialog has focus */
    initialFocus?: 'ok' | 'cancel';
    isFullScreen?: boolean;
    contentClassName?: string;
    maskClassName?: string;
    maskExtraProps?: Record<string, any>;
    contentExtraProps?: Record<string, any>;
}

// a mask confined to a custom popup container leaves the page usable, so only a viewport-wide mask makes the dialog
// modal (aria-modal, inert page, Tab trap, focus return, scroll lock)
export function isModal({ mask, maskFixed, inBody }: Pick<ModalContentProps, 'mask' | 'maskFixed' | 'inBody'>) {
    return Boolean(mask) && (inBody || Boolean(maskFixed));
}

/** E is the host's click event, which the foundation passes on to notifyClose; Escape passes the native KeyboardEvent */
export interface ModalContentAdapter<P extends ModalContentProps = ModalContentProps, E = unknown> extends DefaultAdapter<P> {
    notifyClose: (e: E | KeyboardEvent) => void;
    /** The outermost element, which goes on the overlay stack */
    getRoot: () => HTMLElement | null | undefined;
    /** The `role="dialog"` element, which takes and traps focus */
    getDialog: () => HTMLElement | null | undefined;
}

export default class ModalContentFoundation<P extends ModalContentProps = ModalContentProps, E extends Pick<Event, 'target' | 'currentTarget'> = Pick<Event, 'target' | 'currentTarget'>> extends BaseFoundation<ModalContentAdapter<P, E>, P> {
    // a press that began inside the dialog; its click must not close the dialog even if it ends on the mask
    #dialogMouseDown = false;
    #mouseUpTimer: ReturnType<typeof setTimeout> | undefined = undefined;
    readonly #resources = new ModalResources();
    // the first element outside the default footer that held focus when the dialog opened
    #bodyFocus: HTMLElement | null = null;

    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.close(e);
        return true;
    };

    /** Remembers the element to return focus to; hosts call it on opening, before anything inside the dialog takes focus */
    recordFocus = () => {
        this.#resources.record();
    };

    /** Called when the dialog is shown: joins the overlay stack and moves focus into the dialog (Modal holds the scroll lock) */
    show = () => {
        const dialog = this.adapter.getDialog();
        if (!dialog) {
            return;
        }
        const { preventScroll, initialFocus } = this.getProps();
        const footer = dialog.querySelector(`:scope > .${cssClasses.DIALOG}-footer`);
        const active = FocusTrapHandle.getActiveElement(dialog);
        // A framework focuses an autofocus element on mount at most (React's autoFocus, Svelte's microtask), Vue and
        // Solid not at all, so a keepDOM reopen refocuses the body element the first open focused, else the autofocus
        // element, else the default button; FocusScope would otherwise focus the tabIndex=-1 dialog first.
        // Known limitation: keepDOM with lazyRender={false} that starts hidden mounts under display:none, where
        // mount-time focus fails, so nothing is remembered and the default button wins.
        if (dialog.contains(active)) {
            if (!this.#bodyFocus && active !== dialog && !footer?.contains(active)) {
                this.#bodyFocus = active as HTMLElement;
            }
        } else {
            FocusTrapHandle.pickInitialFocus(dialog, { remembered: this.#bodyFocus, autofocus: true, footer, initialFocus })?.focus({ preventScroll });
        }
        this.#resources.hold({ modal: isModal(this.getProps()), layer: this.adapter.getRoot(), onEscape: this.#handleEscape, lockScroll: false, focus: dialog, preventScroll });
    };

    /** The reverse of `show`; the focus returns to the element recorded on opening */
    hide = () => {
        clearTimeout(this.#mouseUpTimer);
        this.#dialogMouseDown = false;
        this.adapter.getDialog()?.blur();
        this.#resources.release();
    };

    /** Returns focus again, for a host whose framework refocuses the previously focused element after the close */
    restoreFocus = () => {
        this.#resources.restoreFocus();
    };

    handleDialogMouseDown = () => {
        this.#dialogMouseDown = true;
    };

    handleMaskMouseUp = () => {
        if (this.#dialogMouseDown) {
            // the click that ends the press follows this mouseup; clearing at once would close on it
            this.#mouseUpTimer = setTimeout(() => {
                this.#dialogMouseDown = false;
            }, 0);
        }
    };

    handleMaskClick = (e: E) => {
        if (e.target === e.currentTarget && !this.#dialogMouseDown) {
            this.close(e);
        }
    };

    close = (e: E | KeyboardEvent) => {
        this.adapter.notifyClose(e);
    };
}
