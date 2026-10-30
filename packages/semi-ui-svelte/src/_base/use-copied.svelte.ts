import { copyText } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copied` stays true for `duration()` ms after a successful copy; a repeated copy restarts the countdown.
 * Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: () => number) {
    let copied = $state(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;

    const copy = (text: string) =>
        copyText(text).then((res) => {
            if (res && mounted) {
                copied = true;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    copied = false;
                }, duration());
            }
            return res;
        });

    $effect(() => () => {
        mounted = false;
        clearTimeout(timer);
    });

    return {
        get copied() {
            return copied;
        },
        copy,
    };
}
