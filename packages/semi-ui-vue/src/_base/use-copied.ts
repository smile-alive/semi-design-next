import { type Ref, onBeforeUnmount, ref } from 'vue';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
import { ResetTimer } from '@fibrae/semi-foundation/utils/reset-timer';

/**
 * `copied` stays true for `duration()` ms after a successful copy; a repeated copy restarts the countdown.
 * Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: () => number): [Ref<boolean>, (text: string) => Promise<boolean>] {
    const copied = ref(false);
    const timer = new ResetTimer();

    timer.mount();

    const copy = (text: string) =>
        copyText(text).then((res) => {
            if (res && timer.isMounted) {
                copied.value = true;
                timer.start(duration(), () => {
                    copied.value = false;
                });
            }
            return res;
        });

    onBeforeUnmount(() => timer.unmount());

    return [copied, copy];
}
