import { useEffect, useState } from 'react';
import { FreshItems, readNoticeText } from '@fibrae/semi-foundation/base/list-store';
import useAnnouncer from './use-announcer';

/**
 * Announces the items new to a Toast or Notification list or updated in place (alerts announce themselves); `elements`
 * holds the item elements by id. Returns the text of the list's live region.
 */
export default function useNoticeListEffects(items: readonly { id: string; type?: string }[], updatedItems: readonly { id?: string }[], elements: ReadonlyMap<string, Element>, prefixCls: string) {
    const [fresh] = useState(() => new FreshItems());
    const [announcement, announcer] = useAnnouncer();

    useEffect(() => {
        for (const { id } of fresh.pick(items, updatedItems)) {
            announcer.announce(id, () => readNoticeText(elements.get(id), prefixCls));
        }
    }, [items, updatedItems, announcer, elements, fresh, prefixCls]);

    return announcement;
}
