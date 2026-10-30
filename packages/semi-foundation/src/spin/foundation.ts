import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import FocusTrapHandle from '../utils/focus-handle';

export interface SpinAdapter<P extends SpinBaseProps = SpinBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    setLoading: (val: boolean) => void;
}

/** The props the foundation reads with getProps */
export interface SpinBaseProps {
    delay?: number;
}

export default class SpinFoundation<P extends SpinBaseProps = SpinBaseProps, S extends object = object> extends BaseFoundation<SpinAdapter<P, S>, P, S> {
    #timer: ReturnType<typeof setTimeout> = null;
    #heldFocus: HTMLElement | null = null;

    #clearTimer() {
        clearTimeout(this.#timer);
        this.#timer = null;
    }

    /** Shows the spinner after `delay`; stopping hides it at once and drops a pending show */
    handleSpinningChange = (spinning: boolean) => {
        this.#clearTimer();
        const { delay } = this.getProps();
        if (spinning && delay) {
            this.#timer = setTimeout(() => {
                this.#timer = null;
                this.adapter.setLoading(true);
            }, delay);
        } else {
            this.adapter.setLoading(spinning);
        }
    };

    /**
     * Called when the content under `root` becomes inert (`blocked`) or interactive again. inert drops focus to <body> on
     * the next frame, which would restart keyboard users from the top of the page; the root holds it meanwhile and hands
     * it back afterwards.
     */
    handleBlockedChange = (root: HTMLElement, blocked: boolean) => {
        if (blocked) {
            const active = FocusTrapHandle.getActiveElement(root);
            if (active instanceof HTMLElement && active !== root && root.contains(active)) {
                this.#heldFocus = active;
                root.focus();
            }
        } else if (this.#heldFocus) {
            const held = this.#heldFocus;
            this.#heldFocus = null;
            // the root's tabindex went away with the loading state, which already dropped focus to <body>
            if (held.isConnected && (FocusTrapHandle.getActiveElement(root) === root || document.activeElement === document.body)) {
                held.focus();
            }
        }
    };

    override destroy() {
        this.#clearTimer();
    }
}
