import { type Accessor, createSignal, onCleanup } from 'solid-js';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import { ResetTimer } from '@fibrae/semi-foundation/utils/reset-timer';

/**
 * `copy(text)` writes to the clipboard and resolves whether it succeeded; after a success `copied()` stays true for
 * `duration()` ms. A repeated copy restarts the countdown. Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: Accessor<number>): [Accessor<boolean>, (text: string) => Promise<boolean>] {
    const [copied, setCopied] = createSignal(false);
    const timer = new ResetTimer();
    timer.mount();

    onCleanup(() => timer.unmount());

    const copy = (text: string) =>
        copyText(text).then((res) => {
            if (res && timer.isMounted) {
                setCopied(true);
                timer.start(duration(), () => setCopied(false));
            }
            return res;
        });

    return [copied, copy];
}
