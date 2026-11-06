import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import FocusTrapHandle from '../utils/focus-handle';

export interface SpinState {
    loading: boolean;
}

export type SpinAdapter<P extends SpinBaseProps = SpinBaseProps> = DefaultAdapter<P, SpinState>;

export interface SpinBaseProps {
    delay?: number;
    spinning?: boolean;
}

export default class SpinFoundation<P extends SpinBaseProps = SpinBaseProps> extends BaseFoundation<SpinAdapter<P>, P, SpinState> {
    #timer: ReturnType<typeof setTimeout> = null;
    #heldFocus: HTMLElement | null = null;

    static override readonly propKeys = ['spinning'];

    #clearTimer() {
        clearTimeout(this.#timer);
        this.#timer = null;
    }

    static getInitialState(props: SpinBaseProps): SpinState {
        return { loading: props.spinning };
    }

    override handlePropsChange() {
        this.#clearTimer();
        const { delay, spinning } = this.getProps();
        if (spinning && delay) {
            this.#timer = setTimeout(() => {
                this.#timer = null;
                this.setState({ loading: true });
            }, delay);
        } else {
            this.setState({ loading: spinning });
        }
    }

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
