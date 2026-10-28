import { useEffect, useLayoutEffect, useRef } from 'react';
import { pickFreshAnnouncements } from '@fibrae/semi-foundation/utils/announcer';
import useAnnouncer from './use-announcer';

/** What a Toast or Notice gives the list that renders it */
interface NoticeItemHandle {
    restartCloseTimer: () => void;
    leave: () => void;
    announcement: () => string;
}

interface NoticeItem {
    id?: string;
    type?: string;
}

/**
 * The store-driven effects of a Toast or Notification list: restarts the countdown of an item updated in place, stops
 * the countdown of one removed from outside so it cannot call onClose during its leave, and announces the items new to
 * the list or updated in place (alerts announce themselves). Returns the text of the list's live region.
 */
export default function useNoticeListEffects(items: readonly NoticeItem[], updatedItems: readonly NoticeItem[], removedItems: readonly NoticeItem[], handles: ReadonlyMap<string, NoticeItemHandle>) {
    const shownIds = useRef(new Set<string>());

    // keyed on updatedItems so hover re-renders do not restart a paused timer
    useLayoutEffect(() => {
        for (const { id } of updatedItems) {
            handles.get(id)?.restartCloseTimer();
        }
    }, [updatedItems, handles]);

    useLayoutEffect(() => {
        for (const { id } of removedItems) {
            handles.get(id)?.leave();
        }
    }, [removedItems, handles]);

    const [announcement, announcer] = useAnnouncer();

    useEffect(() => {
        const fresh = pickFreshAnnouncements(items, shownIds.current, updatedItems);
        shownIds.current = new Set(items.map((item) => item.id));
        for (const { id } of fresh) {
            announcer.announce(id, () => handles.get(id)?.announcement() ?? '');
        }
    }, [items, updatedItems, announcer, handles]);

    return announcement;
}
