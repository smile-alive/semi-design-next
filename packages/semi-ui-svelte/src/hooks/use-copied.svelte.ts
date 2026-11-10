import { CopiedTimer } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copied` stays true for `duration()` ms after a successful copy; a repeated copy restarts the countdown.
 * Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: () => number) {
    let copied = $state(false);

    const timer = new CopiedTimer((value) => {
        copied = value;
    });

    timer.mount();

    $effect(() => () => timer.unmount());

    return {
        get copied() {
            return copied;
        },
        copy: (text: string) => timer.copy(text, duration()),
    };
}
