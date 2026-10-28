import { describe, expect, it, vi } from 'vite-plus/test';
import NotificationListStore from '../notification-list-foundation';

const ids = (items) => items.map(({ id }) => id);

describe('NotificationListStore', () => {
    it('每次变化都发布新快照并通知订阅者', () => {
        const store = new NotificationListStore();
        const listener = vi.fn<() => void>();
        const unsubscribe = store.subscribe(listener);
        const before = store.getSnapshot();
        expect(store.getSnapshot()).toBe(before);

        store.add({ id: 'a' });
        const after = store.getSnapshot();
        expect(after).not.toBe(before);
        expect(before.notices).toEqual([]);
        expect(ids(after.notices)).toEqual(['a']);
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        store.add({ id: 'b' });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('新消息插入最前，并原位更新已有 id', () => {
        const store = new NotificationListStore();
        store.add({ id: 'a', title: 'a' });
        store.add({ id: 'b', title: 'b' });
        expect(ids(store.getSnapshot().notices)).toEqual(['b', 'a']);

        store.add({ id: 'a', title: 'updated' });
        const { notices, updatedItems } = store.getSnapshot();
        expect(notices.map(({ title }) => title)).toEqual(['b', 'updated']);
        expect(ids(updatedItems)).toEqual(['a']);
        store.add({ id: 'c' });
        expect(store.getSnapshot().updatedItems).toEqual([]);
    });

    it('已移除的通知在订阅期间保留，直到离场动画结束', () => {
        const store = new NotificationListStore();
        store.subscribe(() => {});
        store.add({ id: 'a' });
        store.add({ id: 'b' });
        store.remove('a');
        store.remove('b');
        expect(store.getSnapshot().notices).toEqual([]);
        expect(ids(store.getSnapshot().removedItems)).toEqual(['a', 'b']);

        store.finishLeave('a');
        expect(ids(store.getSnapshot().removedItems)).toEqual(['b']);
        store.add({ id: 'b' });
        expect(ids(store.getSnapshot().notices)).toEqual(['b']);
        expect(store.getSnapshot().removedItems).toEqual([]);
    });

    it('离场中的通知被同 id 重新加入时算作更新，使其重新计时', () => {
        const store = new NotificationListStore();
        store.subscribe(() => {});
        store.add({ id: 'a' });
        store.remove('a');
        store.add({ id: 'a' });
        expect(ids(store.getSnapshot().updatedItems)).toEqual(['a']);
        store.add({ id: 'b' });
        expect(store.getSnapshot().updatedItems).toEqual([]);
    });

    it('没有渲染该 store 时，被移除的通知立即丢弃', () => {
        const store = new NotificationListStore();
        store.add({ id: 'a' });
        store.remove('a');
        expect(store.getSnapshot().notices).toEqual([]);
        expect(store.getSnapshot().removedItems).toEqual([]);
    });

    it('移除或结束未知 id 不产生任何变化', () => {
        const store = new NotificationListStore();
        const listener = vi.fn<() => void>();
        store.subscribe(listener);
        const before = store.getSnapshot();
        store.remove('missing');
        store.finishLeave('missing');
        expect(store.getSnapshot()).toBe(before);
        expect(listener).not.toHaveBeenCalled();
    });

    it('clear 清空列表且不播放离场动画', () => {
        const store = new NotificationListStore();
        store.subscribe(() => {});
        store.add({ id: 'a' });
        store.add({ id: 'b' });
        store.remove('b');
        store.clear();
        expect(store.getSnapshot()).toEqual({ notices: [], removedItems: [], updatedItems: [], order: [] });
    });

    it('离场中的通知保持原来的位置，离场结束后移出顺序', () => {
        const store = new NotificationListStore();
        store.subscribe(() => {});
        store.add({ id: 'a' });
        store.add({ id: 'b' });
        store.add({ id: 'c' });
        store.remove('b');
        expect(store.getSnapshot().order).toEqual(['c', 'b', 'a']);
        store.finishLeave('b');
        expect(store.getSnapshot().order).toEqual(['c', 'a']);
        const idle = new NotificationListStore();
        idle.add({ id: 'a' });
        idle.remove('a');
        expect(idle.getSnapshot().order).toEqual([]);
    });

    it('config 修改默认值，resetConfig 恢复内置默认值', () => {
        const store = new NotificationListStore();
        const builtIn = { ...store.defaults };
        const listener = vi.fn<() => void>();
        store.subscribe(listener);
        store.config({ top: 10, duration: 0, position: 'bottom', zIndex: 2000 });
        expect(store.defaults).toMatchObject({ top: 10, duration: 0, position: 'bottom', zIndex: 2000 });
        expect(listener).not.toHaveBeenCalled();
        store.resetConfig();
        expect(store.defaults).toEqual(builtIn);
    });
});
