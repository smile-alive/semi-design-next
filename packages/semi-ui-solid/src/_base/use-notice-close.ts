import { type Accessor, createEffect, untrack } from 'solid-js';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';

interface NoticeListValue {
    paused: Accessor<boolean>;
    state: Accessor<{ removedItems: readonly { id?: string }[]; updatedItems: readonly { id?: string }[] }>;
}

/** Drives a Toast's or Notice's countdown from its list; an item outside a list keeps its own countdown */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'handleListChange'>, list?: NoticeListValue) {
    if (!list) return;

    createEffect(() => {
        const { removedItems, updatedItems } = list.state();
        const paused = list.paused();
        untrack(() => foundation.handleListChange({ paused, removedItems, updatedItems }));
    });
}
