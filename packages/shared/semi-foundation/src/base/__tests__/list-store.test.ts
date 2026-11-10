import { describe, expect, it, vi } from 'vite-plus/test';
import ListStore, { FreshItems, getStackDepths, isAlertType, isStackExpanded, isStackHidden, readNoticeText } from '../list-store';

interface Item {
    id?: string;
    text?: string;
    type?: string;
    stack?: boolean | number;
}

const create = (insertAt: 'start' | 'end' = 'end', defaults: Item = {}) => new ListStore<Item>(insertAt, 'item', defaults);

const ids = (items: { id: string }[]) => items.map(({ id }) => id);

describe('ListStore', () => {
    it('新项按 insertAt 插入列表与顺序，每次变化发布新快照并通知订阅者', () => {
        const atEnd = create('end');
        const listener = vi.fn<() => void>();
        const unsubscribe = atEnd.subscribe(listener);
        atEnd.open({ id: 'a' }, {});
        const before = atEnd.getSnapshot();
        atEnd.open({ id: 'b' }, {});
        expect(ids(before.items)).toEqual(['a']);
        expect(ids(atEnd.getSnapshot().items)).toEqual(['a', 'b']);
        expect(atEnd.getSnapshot().order).toEqual(['a', 'b']);
        expect(listener).toHaveBeenCalledTimes(2);
        unsubscribe();
        atEnd.open({ id: 'c' }, {});
        expect(listener).toHaveBeenCalledTimes(2);

        const atStart = create('start');
        atStart.open({ id: 'a' }, {});
        atStart.open({ id: 'b' }, {});
        expect(ids(atStart.getSnapshot().items)).toEqual(['b', 'a']);
        expect(atStart.getSnapshot().order).toEqual(['b', 'a']);
    });

    it('open 依次合并默认值、全局默认值与参数，显式 undefined 不覆盖，返回生成的 id', () => {
        const store = create('end', { text: 'default', type: 'info' });
        const id = store.open({ text: undefined }, { type: 'success' });
        expect(id).toMatch(/^item-/);
        expect(store.getSnapshot().items).toEqual([{ id, text: 'default', type: 'success' }]);
    });

    it('同 id 原位更新并写入 updatedItems，之后的任何变化清空它', async () => {
        const store = create();
        store.open({ id: 'a', text: 'a' }, {});
        store.open({ id: 'b' }, {});
        store.open({ id: 'a', text: 'updated' }, {});
        expect(store.getSnapshot().items).toEqual([{ id: 'a', text: 'updated' }, { id: 'b' }]);
        expect(ids(store.getSnapshot().updatedItems)).toEqual(['a']);
        await Promise.resolve();
        store.open({ id: 'c' }, {});
        expect(store.getSnapshot().updatedItems).toEqual([]);
    });

    it('有订阅者时移除项留在 removedItems 与原位，同 id 再次显示时算作更新', () => {
        const store = create();
        store.subscribe(() => {});
        store.open({ id: 'a' }, {});
        store.open({ id: 'b' }, {});
        store.open({ id: 'c' }, {});
        store.remove('b');
        expect(ids(store.getSnapshot().items)).toEqual(['a', 'c']);
        expect(ids(store.getSnapshot().removedItems)).toEqual(['b']);
        expect(store.getSnapshot().order).toEqual(['a', 'b', 'c']);
        store.open({ id: 'b' }, {});
        expect(store.getSnapshot()).toMatchObject({ removedItems: [], order: ['a', 'c', 'b'] });
        expect(ids(store.getSnapshot().updatedItems)).toEqual(['b']);
    });

    it('离场结束后移出 removedItems 与 order，并保留 updatedItems', () => {
        const store = create();
        store.subscribe(() => {});
        store.open({ id: 'a' }, {});
        store.open({ id: 'b' }, {});
        store.remove('a');
        store.open({ id: 'b', text: 'b2' }, {});
        const { updatedItems } = store.getSnapshot();
        store.finishLeave('a');
        expect(store.getSnapshot()).toMatchObject({ removedItems: [], order: ['b'] });
        expect(store.getSnapshot().updatedItems).toBe(updatedItems);
    });

    it('没有订阅者时移除不留 removedItems；移除或结束未知 id 不产生变化', () => {
        const store = create();
        store.open({ id: 'a' }, {});
        store.remove('a');
        expect(store.getSnapshot()).toMatchObject({ items: [], removedItems: [], order: [] });
        const listener = vi.fn<() => void>();
        store.subscribe(listener);
        const before = store.getSnapshot();
        store.remove('missing');
        store.finishLeave('missing');
        expect(store.getSnapshot()).toBe(before);
        expect(listener).not.toHaveBeenCalled();
    });

    it('clear 清空列表、离场项与顺序', () => {
        const store = create();
        store.subscribe(() => {});
        store.open({ id: 'a' }, {});
        store.open({ id: 'b' }, {});
        store.remove('b');
        store.clear();
        expect(store.getSnapshot()).toMatchObject({ items: [], removedItems: [], updatedItems: [], order: [] });
    });

    it.each([
        [true, 3],
        [5, 5],
        [-1, 0],
        [false, 0],
        [undefined, 0],
    ])('open 的 stack: %s 写入堆叠阈值 %s', (stack, threshold) => {
        const store = create();
        store.open({ id: 'a', stack: 1 }, {});
        store.open({ id: 'b', stack }, {});
        expect(store.getSnapshot().stack).toBe(threshold);
    });
});

describe('列表规则', () => {
    it('isStackExpanded：不堆叠、悬停或不超过阈值时展开', () => {
        expect(isStackExpanded(0, false, 9)).toBe(true);
        expect(isStackExpanded(3, true, 9)).toBe(true);
        expect(isStackExpanded(3, false, 3)).toBe(true);
        expect(isStackExpanded(3, false, 4)).toBe(false);
    });

    it('getStackDepths 只把显示中的项算作更新的项，isStackHidden 隐藏第三层之后', () => {
        const depths = getStackDepths(['d', 'c', 'b', 'a'], new Set(['d', 'b', 'a']));
        expect(Object.fromEntries(depths)).toEqual({ d: 0, c: 1, b: 1, a: 2 });
        expect(isStackHidden(false, 3)).toBe(true);
        expect(isStackHidden(false, 2)).toBe(false);
        expect(isStackHidden(true, 5)).toBe(false);
    });

    it('isAlertType：warning 与 error 是 alert', () => {
        expect(isAlertType('warning')).toBe(true);
        expect(isAlertType('error')).toBe(true);
        expect(isAlertType('info')).toBe(false);
        expect(isAlertType(undefined)).toBe(false);
    });

    it('FreshItems 取新增项与原地更新项，排除已显示项和 alert', () => {
        const fresh = new FreshItems();
        expect(fresh.pick([{ id: 'shown', type: 'info' }, { id: 'updated' }, { id: 'updated-error', type: 'error' }], []).map(({ id }) => id)).toEqual(['shown', 'updated']);
        const items = [{ id: 'shown', type: 'info' }, { id: 'updated', type: 'success' }, { id: 'new' }, { id: 'new-warning', type: 'warning' }, { id: 'updated-error', type: 'error' }];
        expect(fresh.pick(items, [{ id: 'updated' }, { id: 'updated-error' }]).map(({ id }) => id)).toEqual(['updated', 'new']);
        expect(fresh.pick(items, [])).toEqual([]);
    });

    it('readNoticeText 拼接标题与内容，跳过空节点和其余文本', () => {
        const notice = document.createElement('div');
        notice.innerHTML = '<span>icon</span><div class="semi-notification-notice-title">标题</div><div class="semi-notification-notice-content"></div><button>关闭</button>';
        expect(readNoticeText(notice, 'semi-notification-notice')).toBe('标题');
        notice.querySelector('.semi-notification-notice-content').textContent = '内容';
        expect(readNoticeText(notice, 'semi-notification-notice')).toBe('标题 内容');
        expect(readNoticeText(null, 'semi-notification-notice')).toBe('');
    });
});
