import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { ModalProps } from '../modal/modal-foundation';

export interface ModalContentProps extends Omit<ModalProps, 'getPopupContainer'> {
    onClose: (e: any) => void;
    /** Whether the dialog renders into body rather than a custom container; Modal resolves it once per render */
    inBody: boolean;
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

/** E is the host's click event, which the foundation passes on to onClose; Escape passes the native KeyboardEvent */
export interface ModalContentAdapter<P extends ModalContentProps = ModalContentProps, E = unknown> extends DefaultAdapter<P> {
    notifyClose: (e: E | KeyboardEvent) => void;
    /** Puts the dialog on the overlay stack (utils/layer); `onEscape` receives Escape while the dialog is on top */
    openLayer: (onEscape: (e: KeyboardEvent) => boolean) => void;
    closeLayer: () => void;
    /** Moves focus into the dialog and keeps Tab inside it */
    trapFocus: () => void;
    releaseFocus: () => void;
    /** Focuses the element that had focus when the dialog opened */
    restoreFocus: () => void;
}

export default class ModalContentFoundation<P extends ModalContentProps = ModalContentProps, E extends Pick<Event, 'target' | 'currentTarget'> = Pick<Event, 'target' | 'currentTarget'>> extends BaseFoundation<ModalContentAdapter<P, E>, P> {
    // a press that began inside the dialog; its click must not close the dialog even if it ends on the mask
    #dialogMouseDown = false;
    #mouseUpTimer: ReturnType<typeof setTimeout> | undefined = undefined;

    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.close(e);
        return true;
    };

    /** Called when the dialog is shown: joins the overlay stack and moves focus into the dialog */
    show = () => {
        this._adapter.openLayer(this.#handleEscape);
        this._adapter.trapFocus();
    };

    /**
     * The reverse of `show`. The layer goes first: it releases the page's inert, and an inert element cannot take
     * the focus back.
     */
    hide = () => {
        this._adapter.closeLayer();
        this._adapter.releaseFocus();
        clearTimeout(this.#mouseUpTimer);
        this.#dialogMouseDown = false;
        this.restoreFocus();
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
        this._adapter.notifyClose(e);
    };

    restoreFocus = () => {
        this._adapter.restoreFocus();
    };
}
