import { describe, expect, it } from 'vite-plus/test';
import { createNotificationListStore, groupNoticesByPosition } from '../notification-list-foundation';

describe('groupNoticesByPosition', () => {
    it('按 order 分到各方位，离场中的通知留在原位', () => {
        const store = createNotificationListStore();
        store.subscribe(() => {});
        store.open({ id: 'a', position: 'bottom' }, {});
        store.open({ id: 'b', position: 'bottom' }, {});
        store.open({ id: 'c' }, {});
        store.remove('b');
        const grouped = groupNoticesByPosition(store.getSnapshot());
        expect(grouped.bottom.map(({ id }) => id)).toEqual(['b', 'a']);
        expect(grouped.topRight.map(({ id }) => id)).toEqual(['c']);
        expect(grouped.topLeft).toEqual([]);
    });

    it('未指定方位时，rtl 去左上角，通知自己的 direction 优先于列表的', () => {
        const store = createNotificationListStore();
        store.open({ id: 'a' }, {});
        store.open({ id: 'b', direction: 'ltr' }, {});
        store.open({ id: 'c', direction: 'rtl' }, {});
        const rtl = groupNoticesByPosition(store.getSnapshot(), 'rtl');
        expect(rtl.topLeft.map(({ id }) => id)).toEqual(['c', 'a']);
        expect(rtl.topRight.map(({ id }) => id)).toEqual(['b']);
        expect(groupNoticesByPosition(store.getSnapshot()).topRight.map(({ id }) => id)).toEqual(['b', 'a']);
    });
});
