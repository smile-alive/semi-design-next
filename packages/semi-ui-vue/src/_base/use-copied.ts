import { type Ref, onBeforeUnmount, ref } from 'vue';
import { copyText } from '@fibrae/semi-foundation/utils/clipboard';

/**
 * `copied` stays true for `duration()` ms after a successful copy; a repeated copy restarts the countdown.
 * Unmounting cancels it and ignores copies still pending.
 */
export default function useCopied(duration: () => number): [Ref<boolean>, (text: string) => Promise<boolean>] {
    const copied = ref(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;

    const copy = (text: string) =>
        copyText(text).then((res) => {
            if (res && mounted) {
                copied.value = true;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    copied.value = false;
                }, duration());
            }
            return res;
        });

    onBeforeUnmount(() => {
        mounted = false;
        clearTimeout(timer);
    });

    return [copied, copy];
}
