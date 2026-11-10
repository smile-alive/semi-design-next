import { type Ref, onBeforeUnmount, ref } from 'vue';
import { CopiedTimer } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copied` stays true for `duration()` ms after a successful copy; a repeated copy restarts the countdown.
 * Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: () => number): [Ref<boolean>, (text: string) => Promise<boolean>] {
    const copied = ref(false);

    const timer = new CopiedTimer((value) => {
        copied.value = value;
    });

    timer.mount();

    onBeforeUnmount(() => timer.unmount());

    return [copied, (text) => timer.copy(text, duration())];
}
