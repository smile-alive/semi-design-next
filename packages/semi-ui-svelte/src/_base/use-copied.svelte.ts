import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import { ResetTimer } from '@fibrae/semi-foundation/utils/reset-timer';

/**
 * `copied` stays true for `duration()` ms after a successful copy; a repeated copy restarts the countdown.
 * Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: () => number) {
    let copied = $state(false);
    const timer = new ResetTimer();

    timer.mount();

    const copy = (text: string) =>
        copyText(text).then((res) => {
            if (res && timer.isMounted) {
                copied = true;
                timer.start(duration(), () => {
                    copied = false;
                });
            }
            return res;
        });

    $effect(() => () => timer.unmount());

    return {
        get copied() {
            return copied;
        },
        copy,
    };
}
