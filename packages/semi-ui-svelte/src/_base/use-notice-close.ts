import { onMount } from 'svelte';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';
import watch from './watch.svelte.js';

/** What a Toast or Notification list gives each item; read through the getters so the item follows the list */
export interface NoticeListState {
    paused: boolean;
    removedItems: readonly { id?: string }[];
    updatedItems: readonly { id?: string }[];
}

/**
 * Drives a Toast's or Notice's countdown from its list. `onShow` runs when the item mounts and after each in-place
 * update. Call it after useFoundation, so these effects run after init() has started the countdown; an item outside a
 * list keeps its own countdown.
 *
 * The leave is stopped here because Svelte keeps an outgoing item's effects alive until its outro ends, and the
 * foundation's destroy only runs after that: without `leave()` the countdown would fire onClose mid-leave.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'pauseCloseTimer' | 'handleListPausedChange' | 'handleListRemoved' | 'handleListUpdated'>, list: NoticeListState | undefined, onShow: () => void) {
    if (!list) return;

    watch(
        () => list.paused,
        (paused) => foundation.handleListPausedChange(paused)
    );

    watch(
        () => list.removedItems,
        (items) => foundation.handleListRemoved(items)
    );

    // Store changes keeping the same updatedItems (a finished leave, a stack change) do not trigger this, so a paused
    // countdown is not restarted.
    watch(
        () => list.updatedItems,
        (items) => {
            if (foundation.handleListUpdated(items)) onShow();
        }
    );

    onMount(() => {
        if (list.paused) foundation.pauseCloseTimer();
        onShow();
    });
}
