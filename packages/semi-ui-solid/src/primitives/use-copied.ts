import { type Accessor, createSignal, onCleanup } from 'solid-js';
import { CopiedTimer } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copy(text)` writes to the clipboard and resolves whether it succeeded; after a success `copied()` stays true for
 * `duration()` ms. A repeated copy restarts the countdown. Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: Accessor<number>): [Accessor<boolean>, (text: string) => Promise<boolean>] {
    const [copied, setCopied] = createSignal(false);
    const timer = new CopiedTimer(setCopied);
    timer.mount();

    onCleanup(() => timer.unmount());

    return [copied, (text) => timer.copy(text, duration())];
}
