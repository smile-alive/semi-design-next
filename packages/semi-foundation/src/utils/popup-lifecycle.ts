/**
 * The reports one showing of an overlay owes (Tooltip, Modal, SideSheet): `afterOpen` at most once, once it has entered,
 * and `afterClose` exactly once, once it has left or, when it unmounts while still shown, at the unmount.
 */
export default class PopupLifecycle {
    #openPending = false;
    #closePending = false;

    /** A showing begins; a reopening during the leave of the previous one continues it and still owes one close */
    show() {
        this.#openPending = true;
        this.#closePending = true;
    }

    /** The showing has entered: reports the opening unless it was already reported or the showing ended */
    entered(report: () => void) {
        if (this.#openPending) {
            this.#openPending = false;
            report();
        }
    }

    /** The showing has ended: it left, or the overlay unmounted while shown; reports a close not reported yet */
    ended(report: () => void) {
        this.#openPending = false;
        if (this.#closePending) {
            this.#closePending = false;
            report();
        }
    }
}
