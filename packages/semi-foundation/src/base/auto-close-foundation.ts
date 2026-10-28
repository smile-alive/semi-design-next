import BaseFoundation, { type DefaultAdapter } from './foundation';

/** The props the foundation reads with getProp */
export interface AutoCloseBaseProps {
    id?: string;
    // seconds; 0 or unset never closes on its own
    duration?: number;
}

export interface AutoCloseAdapter<P extends AutoCloseBaseProps = AutoCloseBaseProps, S = Record<string, never>> extends DefaultAdapter<P, S> {
    notifyWrapperToRemove: (id: string) => void;
    notifyClose: () => void;
    /** Only Notice reports the click on its close button, ahead of the close itself */
    notifyCloseClick?: (id: string) => void;
}

/** Closes a toast or notice after `duration`; the list pauses the countdown on hover and restarts it after */
export default class AutoCloseFoundation<P extends AutoCloseBaseProps = AutoCloseBaseProps, S = Record<string, never>> extends BaseFoundation<AutoCloseAdapter<P, S>, P, S> {
    #timer: ReturnType<typeof setTimeout> | null = null;

    #id: string | null = null;

    // an update while hovered must not start the countdown the hover paused
    #paused = false;

    // removed from outside: hover/focus ending during the leave animation must not restart the countdown
    #leaving = false;

    override init() {
        this.startCloseTimer();
        this.#id = this.getProp('id');
    }

    override destroy() {
        this.clearCloseTimer();
    }

    leave() {
        this.#leaving = true;
        this.clearCloseTimer();
    }

    pauseCloseTimer() {
        this.#paused = true;
        this.clearCloseTimer();
    }

    resumeCloseTimer() {
        this.#paused = false;
        this.startCloseTimer();
    }

    startCloseTimer() {
        this.clearCloseTimer();
        const duration = this.getProp('duration');
        if (!this.#leaving && duration && typeof duration === 'number') {
            this.#timer = setTimeout(() => {
                this.close();
            }, duration * 1000);
        }
    }

    clickClose(e: { stopPropagation: () => void }) {
        // the click must not reach the item's own handler, also when it is ignored
        e.stopPropagation();
        if (this.#leaving) {
            return;
        }
        this._adapter.notifyCloseClick?.(this.#id);
        this.close();
    }

    close(e?: { stopPropagation: () => void }) {
        e?.stopPropagation();
        // the item stays mounted until its leave animation ends, and a second click or Enter must not report again
        if (this.#leaving) {
            return;
        }
        this.#leaving = true;
        this.clearCloseTimer();
        this._adapter.notifyWrapperToRemove(this.#id);
        this._adapter.notifyClose();
    }

    clearCloseTimer() {
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    restartCloseTimer() {
        this.#leaving = false;
        this.clearCloseTimer();
        if (!this.#paused) {
            this.startCloseTimer();
        }
    }
}
