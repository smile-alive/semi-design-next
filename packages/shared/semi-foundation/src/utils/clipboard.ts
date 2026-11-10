import { ResetTimer } from '../base/reset-timer';

// Resolves false instead of rejecting, so callers report failure through their own callbacks rather than leaking
// unhandled rejections; no execCommand fallback because the app is served over HTTPS only
export function copyText(text: string) {
    return navigator.clipboard.writeText(text).then(
        () => true,
        () => false
    );
}

/** Holds a "copied" flag for `duration` ms after each successful copy; a repeated copy restarts the countdown. */
export class CopiedTimer {
    #timer = new ResetTimer();
    #onChange: (copied: boolean) => void;

    constructor(onChange: (copied: boolean) => void) {
        this.#onChange = onChange;
    }

    mount() {
        this.#timer.mount();
    }

    unmount() {
        this.#timer.unmount();
    }

    copy(text: string, duration: number) {
        return copyText(text).then((res) => {
            if (res && this.#timer.isMounted) {
                this.#onChange(true);
                this.#timer.start(duration, () => this.#onChange(false));
            }
            return res;
        });
    }
}
