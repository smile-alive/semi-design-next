import { type ComputedRef, onMounted, watch } from 'vue';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';
import type { AutoCloseListState } from '@fibrae/semi-foundation/base/auto-close-foundation';

/**
 * Drives a Toast's or Notice's countdown from its list; an item outside a list keeps its own countdown. A removed item
 * is unmounted at once, so the list reports no removals.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'handleListChange'>, list: ComputedRef<AutoCloseListState> | undefined) {
    if (!list) return;

    // Post flush: the updated duration has reached the props. The foundation tells a changed field from an untouched one
    // by identity, so store changes that keep the same updatedItems (a finished leave, a stack change) do not restart a
    // paused countdown.
    watch(list, (state) => foundation.handleListChange(state), { flush: 'post' });

    onMounted(() => foundation.handleListChange(list.value));
}
