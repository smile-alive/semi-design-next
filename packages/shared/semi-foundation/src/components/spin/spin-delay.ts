import { ResetTimer } from '../../base/reset-timer';

export interface SpinDelayOptions {
    /** ms `loading` must stay true before the spinner shows */
    delay?: number;
    /** ms the spinner stays once shown, even if `loading` turns false sooner */
    minDuration?: number;
    /**
     * Whether a host that starts with `loading` true shows the spinner at once: the server cannot wait for `delay`, and
     * hydration must match its markup. `false` hides it for `delay` on every mount, e.g. inside a Suspense fallback.
     */
    ssr?: boolean;
}

export const spinDelayDefaults = { delay: 500, minDuration: 200, ssr: true } satisfies Required<SpinDelayOptions>;

// `paused` is shown without a running hold: the initial render, or a mount the host tore down mid-hold
type Phase = 'idle' | 'delay' | 'display' | 'expire' | 'paused';

/**
 * Turns a `loading` flag into a "show the spinner" flag that ignores loads shorter than `delay` and, once shown, keeps
 * the spinner for at least `minDuration`, so it neither flashes in nor flashes out. The host calls `mount` before the
 * first `update`, `update` on mount and whenever `loading` or the options change, and `unmount` on teardown.
 */
export class SpinDelay {
    #timer = new ResetTimer();
    #phase: Phase;
    #loading = false;
    #onChange: (visible: boolean) => void;

    /** `visible` is what the host rendered first, see `SpinDelay.initialVisible` */
    constructor(visible: boolean, onChange: (visible: boolean) => void) {
        this.#phase = visible ? 'paused' : 'idle';
        this.#onChange = onChange;
    }

    #show(minDuration: number) {
        this.#onChange(true);
        if (minDuration <= 0) {
            this.#phase = 'expire';
            return;
        }
        this.#phase = 'display';
        this.#timer.start(minDuration, () => {
            if (this.#loading) {
                this.#phase = 'expire';
            } else {
                this.#hide();
            }
        });
    }

    #hide() {
        this.#phase = 'idle';
        this.#onChange(false);
    }

    static initialVisible(loading: boolean, ssr: boolean = spinDelayDefaults.ssr) {
        return Boolean(loading && ssr);
    }

    mount() {
        this.#timer.mount();
    }

    unmount() {
        this.#timer.unmount();
        if (this.#phase === 'delay') {
            this.#phase = 'idle';
        } else if (this.#phase === 'display') {
            this.#phase = 'paused';
        }
    }

    update(loading: boolean, { delay = spinDelayDefaults.delay, minDuration = spinDelayDefaults.minDuration }: SpinDelayOptions = {}) {
        this.#loading = loading;
        switch (this.#phase) {
            case 'idle':
                if (!loading) {
                    break;
                }
                if (delay > 0) {
                    this.#phase = 'delay';
                    this.#timer.start(delay, () => this.#show(minDuration));
                } else {
                    this.#show(minDuration);
                }
                break;
            case 'delay':
                if (!loading) {
                    this.#timer.clear();
                    this.#phase = 'idle';
                }
                break;
            case 'paused':
                this.#show(minDuration);
                break;
            case 'expire':
                if (!loading) {
                    this.#hide();
                }
                break;
            // 'display' waits for the hold to end, which reads the latest `loading`
        }
    }
}
