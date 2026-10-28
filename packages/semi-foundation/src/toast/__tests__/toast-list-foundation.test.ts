import { describe, expect, it, vi } from 'vite-plus/test';
import ToastListStore from '../toast-list-foundation';

const ids = (items) => items.map(({ id }) => id);

describe('ToastListStore', () => {
    it('每次变化都发布新快照并通知订阅者，旧快照不变', () => {
        const store = new ToastListStore();
        const listener = vi.fn<() => void>();
        const unsubscribe = store.subscribe(listener);
        store.add({ id: 'a', content: 'a' });
        const before = store.getSnapshot();
        expect(store.getSnapshot()).toBe(before);

        store.add({ id: 'b', content: 'b' });
        expect(store.getSnapshot()).not.toBe(before);
        expect(ids(before.list)).toEqual(['a']);
        expect(ids(store.getSnapshot().list)).toEqual(['a', 'b']);
        expect(store.getSnapshot().order).toEqual(['a', 'b']);
        expect(listener).toHaveBeenCalledTimes(2);

        unsubscribe();
        store.add({ id: 'c', content: 'c' });
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('同 id 原位更新并写入 updatedItems，之后的任何变化清空它', () => {
        const store = new ToastListStore();
        store.add({ id: 'a', content: 'a' });
        store.add({ id: 'b', content: 'b' });
        store.add({ id: 'a', content: 'updated' });
        const { list, updatedItems, order } = store.getSnapshot();
        expect(list.map(({ content }) => content)).toEqual(['updated', 'b']);
        expect(ids(updatedItems)).toEqual(['a']);
        expect(order).toEqual(['a', 'b']);

        store.add({ id: 'c', content: 'c' });
        expect(store.getSnapshot().updatedItems).toEqual([]);
    });

    it('离场中的 Toast 保留位置，离场中同 id 再次显示时排到末尾', () => {
        const store = new ToastListStore();
        store.subscribe(() => {});
        store.add({ id: 'a', content: 'a' });
        store.add({ id: 'b', content: 'b' });
        store.add({ id: 'c', content: 'c' });
        store.remove('b');
        expect(ids(store.getSnapshot().list)).toEqual(['a', 'c']);
        expect(ids(store.getSnapshot().removedItems)).toEqual(['b']);
        expect(store.getSnapshot().order).toEqual(['a', 'b', 'c']);

        store.add({ id: 'b', content: 'b2' });
        expect(store.getSnapshot().removedItems).toEqual([]);
        expect(store.getSnapshot().order).toEqual(['a', 'c', 'b']);
        expect(ids(store.getSnapshot().updatedItems)).toEqual(['b']);
    });

    it('离场动画结束后移出 removedItems 与 order，并保留 updatedItems', () => {
        const store = new ToastListStore();
        store.subscribe(() => {});
        store.add({ id: 'a', content: 'a' });
        store.add({ id: 'b', content: 'b' });
        store.remove('a');
        store.add({ id: 'b', content: 'b2' });
        const { updatedItems } = store.getSnapshot();

        store.finishLeave('a');
        expect(store.getSnapshot().removedItems).toEqual([]);
        expect(store.getSnapshot().order).toEqual(['b']);
        expect(store.getSnapshot().updatedItems).toBe(updatedItems);
    });

    it('没有订阅者（列表未挂载）时移除不留 removedItems', () => {
        const store = new ToastListStore();
        store.add({ id: 'a', content: 'a' });
        store.remove('a');
        expect(store.getSnapshot()).toMatchObject({ list: [], removedItems: [], order: [] });
    });

    it('移除或结束未知 id 不产生任何变化', () => {
        const store = new ToastListStore();
        const listener = vi.fn<() => void>();
        store.subscribe(listener);
        const before = store.getSnapshot();
        store.remove('missing');
        store.finishLeave('missing');
        expect(store.getSnapshot()).toBe(before);
        expect(listener).not.toHaveBeenCalled();
    });

    it('clear 清空列表、离场项与顺序', () => {
        const store = new ToastListStore();
        store.subscribe(() => {});
        store.add({ id: 'a', content: 'a' });
        store.add({ id: 'b', content: 'b' });
        store.remove('b');
        store.clear();
        expect(store.getSnapshot()).toMatchObject({ list: [], removedItems: [], updatedItems: [], order: [] });
    });

    it('setStack 写入快照，值不变时不发布', () => {
        const store = new ToastListStore();
        const listener = vi.fn<() => void>();
        store.subscribe(listener);
        expect(store.getSnapshot().stack).toBe(0);
        store.setStack(true);
        expect(store.getSnapshot().stack).toBe(3);
        expect(listener).toHaveBeenCalledTimes(1);
        store.setStack(3);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('config 只接受合法主题，resetConfig 恢复到创建时的配置', () => {
        const store = new ToastListStore({ top: 77, duration: 5 });
        expect(store.defaults).toEqual({ motion: true, zIndex: 1010, content: '', top: 77, duration: 5 });
        store.config({ top: 10, zIndex: 2000, theme: 'light' });
        // an untyped caller may pass a theme outside the whitelist
        store.config({ theme: 'dark' as 'light' });
        expect(store.defaults).toMatchObject({ top: 10, zIndex: 2000, theme: 'light', duration: 5 });
        store.resetConfig();
        expect(store.defaults).toEqual({ motion: true, zIndex: 1010, content: '', top: 77, duration: 5 });
    });

    it.each([
        [true, 3],
        [5, 5],
        [-1, 0],
        [false, 0],
        [undefined, 0],
    ])('setStack(%s) 的堆叠阈值为 %s', (option, threshold) => {
        const store = new ToastListStore();
        store.setStack(1);
        store.setStack(option);
        expect(store.getSnapshot().stack).toBe(threshold);
    });
});
