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
 * Drives a Toast's or Notice's countdown from its list: paused while the list is, stopped when the store removes the
 * item, restarted when the store updates it in place. `onShow` runs when the item mounts and after each such update.
 * Call it after useFoundation, so these effects run after init() has started the countdown; an item outside a list
 * keeps its own countdown.
 *
 * The leave is stopped here because Svelte keeps an outgoing item's effects alive until its outro ends, and the
 * foundation's destroy only runs after that: without `leave()` the countdown would fire onClose mid-leave.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'pauseCloseTimer' | 'resumeCloseTimer' | 'leave' | 'restartCloseTimer'>, list: NoticeListState | undefined, id: () => string | undefined, onShow: () => void) {
    if (!list) return;

    watch(
        () => list.paused,
        (paused) => (paused ? foundation.pauseCloseTimer() : foundation.resumeCloseTimer())
    );

    watch(
        () => list.removedItems.some((item) => item.id === id()),
        (removed) => {
            if (removed) foundation.leave();
        }
    );

    // Store changes keeping the same updatedItems (a finished leave, a stack change) do not trigger this, so a paused
    // countdown is not restarted.
    watch(
        () => list.updatedItems,
        (items) => {
            if (!items.some((item) => item.id === id())) return;
            foundation.restartCloseTimer();
            onShow();
        }
    );

    onMount(() => {
        if (list.paused) foundation.pauseCloseTimer();
        onShow();
    });
}
