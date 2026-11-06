import { type ComputedRef, onMounted, watch } from 'vue';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';

interface NoticeListState {
    paused: boolean;
    updatedItems: readonly { id?: string }[];
}

/**
 * Drives a Toast's or Notice's countdown from its list. `onShow` runs when the item mounts and after each in-place
 * update. Call it after useFoundation, so these hooks run after init() has started the countdown; an item outside a
 * list keeps its own countdown.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'pauseCloseTimer' | 'handleListPausedChange' | 'handleListUpdated'>, list: ComputedRef<NoticeListState> | undefined, onShow: () => void) {
    if (!list) return;

    watch(
        () => list.value.paused,
        (paused) => foundation.handleListPausedChange(paused)
    );

    // Post flush: the updated duration has reached the props. Store changes keeping the same updatedItems (a finished
    // leave, a stack change) do not trigger this, so a paused countdown is not restarted.
    watch(
        () => list.value.updatedItems,
        (items) => {
            if (foundation.handleListUpdated(items)) onShow();
        },
        { flush: 'post' }
    );

    onMounted(() => {
        if (list.value.paused) foundation.pauseCloseTimer();
        onShow();
    });
}
