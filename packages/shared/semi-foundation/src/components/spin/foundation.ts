import { FocusTrapHandle, BaseFoundation, type DefaultAdapter } from '../../base/index';
import { SpinDelay } from './spin-delay';

export interface SpinState {
    loading: boolean;
}

export type SpinAdapter<P extends SpinBaseProps = SpinBaseProps> = DefaultAdapter<P, SpinState>;

export interface SpinBaseProps {
    delay?: number;
    minDuration?: number;
    spinning?: boolean;
}

/** The host renders `state.loading` only when this holds; otherwise `spinning` itself, a commit sooner */
export const isSpinDelayed = ({ delay, minDuration }: SpinBaseProps) => Boolean(delay || minDuration);

export default class SpinFoundation<P extends SpinBaseProps = SpinBaseProps> extends BaseFoundation<SpinAdapter<P>, P, SpinState> {
    #delay: SpinDelay | null = null;
    #heldFocus: HTMLElement | null = null;

    static override readonly propKeys = ['spinning'];

    #update() {
        const { delay = 0, minDuration = 0, spinning } = this.getProps();
        this.#delay.update(spinning, { delay, minDuration });
    }

    // a mount that starts spinning shows at once, as the server rendered it, whatever `delay` says
    static getInitialState(props: SpinBaseProps): SpinState {
        return { loading: SpinDelay.initialVisible(props.spinning) };
    }

    override init() {
        this.#delay = new SpinDelay(this.getState('loading'), (loading) => this.setState({ loading }));
        this.#delay.mount();
        this.#update();
    }

    override handlePropsChange() {
        this.#update();
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
        this.#delay.unmount();
    }
}
