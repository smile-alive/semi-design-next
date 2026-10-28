import { type Accessor, createSignal, onCleanup } from 'solid-js';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copy(text)` writes to the clipboard and resolves whether it succeeded; after a success `copied()` stays true for
 * `duration()` ms. A repeated copy restarts the countdown. Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: Accessor<number>): [Accessor<boolean>, (text: string) => Promise<boolean>] {
    const [copied, setCopied] = createSignal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;

    onCleanup(() => {
        mounted = false;
        clearTimeout(timer);
    });

    const copy = (text: string) =>
        copyText(text).then((res) => {
            if (res && mounted) {
                setCopied(true);
                clearTimeout(timer);
                timer = setTimeout(() => setCopied(false), duration());
            }
            return res;
        });

    return [copied, copy];
}
