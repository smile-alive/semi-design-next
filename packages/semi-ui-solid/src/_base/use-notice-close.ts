import { type Accessor, createEffect, createMemo, on } from 'solid-js';
import type AutoCloseFoundation from '@fibrae/semi-foundation/base/auto-close-foundation';

/** What a Toast or Notification list gives each item */
interface NoticeListValue {
    paused: Accessor<boolean>;
    state: Accessor<{ removedItems: readonly { id?: string }[]; updatedItems: readonly { id?: string }[] }>;
}

/**
 * Drives a Toast's or Notice's countdown from its list: paused while the list is, stopped when the store removes the
 * item, restarted when the store updates it in place. An item outside a list keeps its own countdown.
 * Call it after useFoundation: its onMount init starts the countdown without looking at the pause, so the paused
 * effect must run after it.
 */
export default function useNoticeClose(foundation: Pick<AutoCloseFoundation, 'pauseCloseTimer' | 'resumeCloseTimer' | 'leave' | 'restartCloseTimer'>, list: NoticeListValue | undefined, id: () => string | undefined) {
    const paused = createMemo(() => list?.paused() ?? false);
    const removed = createMemo(() => list?.state().removedItems.some((item) => item.id === id()) ?? false);

    createEffect(
        on(paused, (isPaused, wasPaused) => {
            if (isPaused) {
                foundation.pauseCloseTimer();
            } else if (wasPaused) {
                foundation.resumeCloseTimer();
            }
        })
    );

    // removed from outside: the countdown must not call onClose during the leave
    createEffect(
        on(removed, (isRemoved) => {
            if (isRemoved) {
                foundation.leave();
            }
        })
    );

    createEffect(
        on(
            () => list?.state().updatedItems,
            (items) => {
                if (items?.some((item) => item.id === id())) {
                    foundation.restartCloseTimer();
                }
            },
            { defer: true }
        )
    );
}
