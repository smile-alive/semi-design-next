import { describe, expect, it } from 'vite-plus/test';
import ListStore, { type ListStoreState } from '../list-store';

interface Item {
    id: string;
    text?: string;
}

interface State extends ListStoreState<Item> {
    items: Item[];
    extra: number;
}

const create = (insertAt: 'start' | 'end') => new ListStore<Item, 'items', State>('items', insertAt, { items: [], removedItems: [], updatedItems: [], order: [], extra: 1 });

const ids = (items: Item[]) => items.map(({ id }) => id);

describe('ListStore', () => {
    it('新项按 insertAt 插入列表与顺序', () => {
        const atEnd = create('end');
        atEnd.add({ id: 'a' });
        atEnd.add({ id: 'b' });
        expect(ids(atEnd.getSnapshot().items)).toEqual(['a', 'b']);
        expect(atEnd.getSnapshot().order).toEqual(['a', 'b']);

        const atStart = create('start');
        atStart.add({ id: 'a' });
        atStart.add({ id: 'b' });
        expect(ids(atStart.getSnapshot().items)).toEqual(['b', 'a']);
        expect(atStart.getSnapshot().order).toEqual(['b', 'a']);
    });

    it('同 id 原位更新并写入 updatedItems', () => {
        const store = create('end');
        store.add({ id: 'a', text: 'a' });
        store.add({ id: 'b' });
        store.add({ id: 'a', text: 'updated' });
        expect(store.getSnapshot().items).toEqual([{ id: 'a', text: 'updated' }, { id: 'b' }]);
        expect(ids(store.getSnapshot().updatedItems)).toEqual(['a']);
    });

    it('有订阅者时移除项留在 removedItems，离场结束后保留 updatedItems', () => {
        const store = create('end');
        store.subscribe(() => {});
        store.add({ id: 'a' });
        store.add({ id: 'b' });
        store.remove('a');
        expect(ids(store.getSnapshot().removedItems)).toEqual(['a']);
        store.add({ id: 'b', text: 'b2' });
        const { updatedItems } = store.getSnapshot();
        store.finishLeave('a');
        expect(store.getSnapshot()).toMatchObject({ removedItems: [], order: ['b'] });
        expect(store.getSnapshot().updatedItems).toBe(updatedItems);
    });

    it('clear 与 set 保留其他字段，set 默认清空 updatedItems', () => {
        const store = create('end');
        store.add({ id: 'a' });
        store.add({ id: 'a' });
        store.set({ extra: 2 });
        expect(store.getSnapshot()).toMatchObject({ extra: 2, updatedItems: [] });
        store.clear();
        expect(store.getSnapshot()).toEqual({ items: [], removedItems: [], updatedItems: [], order: [], extra: 2 });
    });
});
