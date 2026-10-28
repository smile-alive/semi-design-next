import { type ComputedRef, onMounted, watch } from 'vue';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';

/** What a Toast or Notification list gives each item */
interface NoticeListState {
    paused: boolean;
    updatedItems: readonly { id?: string }[];
}

/**
 * Drives a Toast's or Notice's countdown from its list: paused while the list is, restarted when the store updates the
 * item in place. `onShow` runs when the item mounts and after each such update. Call it after useFoundation, so these
 * hooks run after init() has started the countdown; an item outside a list keeps its own countdown.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'pauseCloseTimer' | 'resumeCloseTimer' | 'restartCloseTimer'>, list: ComputedRef<NoticeListState> | undefined, id: () => string | undefined, onShow: () => void) {
    if (!list) return;

    watch(
        () => list.value.paused,
        (paused) => (paused ? foundation.pauseCloseTimer() : foundation.resumeCloseTimer())
    );

    // Post flush: the updated duration has reached the props. Store changes keeping the same updatedItems (a finished
    // leave, a stack change) do not trigger this, so a paused countdown is not restarted.
    watch(
        () => list.value.updatedItems,
        (items) => {
            if (!items.some((item) => item.id === id())) return;
            foundation.restartCloseTimer();
            onShow();
        },
        { flush: 'post' }
    );

    onMounted(() => {
        if (list.value.paused) foundation.pauseCloseTimer();
        onShow();
    });
}
