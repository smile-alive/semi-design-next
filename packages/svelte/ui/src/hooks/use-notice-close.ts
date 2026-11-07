import { onMount } from 'svelte';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';
import type { AutoCloseListState } from '@fibrae/semi-foundation/base/auto-close-foundation';
import watch from './watch.svelte.js';

/** What a Toast or Notification list gives each item; read through the getters so the item follows the list */
export type NoticeListState = Required<AutoCloseListState>;

/**
 * Drives a Toast's or Notice's countdown from its list; an item outside a list keeps its own countdown. `onShow` runs
 * when the item mounts and after each in-place update.
 *
 * The removal is reported because Svelte keeps an outgoing item's effects alive until its outro ends, and the
 * foundation's destroy only runs after that: without it the countdown would fire onClose mid-leave.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'handleListChange'>, list: NoticeListState | undefined, onShow: () => void) {
    if (!list) return;

    const state = () => ({ paused: list.paused, removedItems: list.removedItems, updatedItems: list.updatedItems });

    // The foundation tells a changed field from an untouched one by identity, so store changes that keep the same
    // updatedItems (a finished leave, a stack change) do not restart a paused countdown.
    watch(state, (value) => {
        if (foundation.handleListChange(value)) onShow();
    });

    onMount(() => {
        foundation.handleListChange(state());
        onShow();
    });
}
