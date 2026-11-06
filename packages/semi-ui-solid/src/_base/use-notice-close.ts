import { type Accessor, createEffect, createMemo, on } from 'solid-js';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';

interface NoticeListValue {
    paused: Accessor<boolean>;
    state: Accessor<{ removedItems: readonly { id?: string }[]; updatedItems: readonly { id?: string }[] }>;
}

/**
 * Drives a Toast's or Notice's countdown from its list. An item outside a list keeps its own countdown.
 * Call it after useFoundation: its onMount init starts the countdown without looking at the pause, so the paused
 * effect must run after it.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'handleListPausedChange' | 'handleListRemoved' | 'handleListUpdated'>, list: NoticeListValue | undefined) {
    const paused = createMemo(() => list?.paused() ?? false);

    // `wasPaused` is undefined on the first run, which is no change: init() has already started the countdown
    createEffect(
        on(paused, (isPaused, wasPaused) => {
            if (isPaused || wasPaused) {
                foundation.handleListPausedChange(isPaused);
            }
        })
    );

    createEffect(
        on(
            () => list?.state().removedItems,
            (items) => {
                if (items) foundation.handleListRemoved(items);
            }
        )
    );

    createEffect(
        on(
            () => list?.state().updatedItems,
            (items) => {
                if (items) foundation.handleListUpdated(items);
            },
            { defer: true }
        )
    );
}
