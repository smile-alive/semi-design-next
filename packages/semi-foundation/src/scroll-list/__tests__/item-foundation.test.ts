import { describe, expect, it, vi } from 'vite-plus/test';
import ItemFoundation, { type ScrollItemAdapter, type ScrollItemBaseProps, type ScrollItemBaseState } from '../item-foundation';

// jsdom has no layout: items are 36px rows and the scroll element is 180px tall
function createColumn(initialProps: ScrollItemBaseProps) {
    let props = initialProps;
    let state: ScrollItemBaseState = { prependCount: 0, appendCount: 0 };
    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'offsetHeight', { value: 180 });
    const list = document.createElement('ul');
    const selector = document.createElement('div');
    wrapper.append(list);
    document.body.append(wrapper);
    const createItem = () => {
        const li = document.createElement('li');
        Object.defineProperty(li, 'offsetHeight', { value: 36 });
        Object.defineProperty(li, 'offsetTop', { get: () => Array.prototype.indexOf.call(list.children, li) * 36 });
        return li;
    };
    const items = (count: number) => Array.from({ length: count }, createItem);
    list.append(...items(props.list.length));
    const notifySelectItem = vi.fn<ScrollItemAdapter['notifySelectItem']>();
    const adapter: ScrollItemAdapter = {
        getContext: () => undefined,
        getContexts: () => undefined,
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => state[key],
        getStates: () => state,
        setState: (partial, callback) => {
            state = { ...state, ...partial };
            callback?.();
        },
        getListNode: () => list,
        getScrollNode: () => wrapper,
        getSelectorNode: () => selector,
        notifySelectItem,
    };
    return {
        foundation: new ItemFoundation(adapter),
        list,
        items,
        wrapper,
        selector,
        notifySelectItem,
        setProps: (next: Partial<ScrollItemBaseProps>) => {
            props = { ...props, ...next };
        },
    };
}

describe('ItemFoundation', () => {
    it('selectedIndex 变化时，从选中项当前所在的副本按偏移取目标项并居中，不通知 onSelect', () => {
        const column = createColumn({
            list: Array.from({ length: 4 }, (_, value) => ({ value })),
            selectedIndex: 1,
            cycled: true,
            mode: 'normal',
            motion: false,
        });
        column.foundation.init();
        column.list.prepend(...column.items(4));
        column.list.append(...column.items(4));

        column.setProps({ selectedIndex: 3 });
        column.foundation.syncSelectedIndex(3, 1);
        expect(column.wrapper.scrollTop).toBe(180);

        column.setProps({ selectedIndex: 0 });
        column.foundation.syncSelectedIndex(0, 3);
        expect(column.wrapper.scrollTop).toBe(72);
        expect(column.notifySelectItem).not.toHaveBeenCalled();
        column.foundation.destroy();
        column.wrapper.remove();
    });

    it('循环 wheel 列首尾相接时取最近的等价项：12 项从 11 到 0 向下走 1 行', () => {
        const column = createColumn({
            list: Array.from({ length: 12 }, (_, value) => ({ value })),
            selectedIndex: 11,
            cycled: true,
            mode: 'wheel',
            motion: false,
        });
        column.foundation.init();
        // the infinite list adds a copy on each side; item 11 is now at index 23 and the next copy's item 0 at 24
        column.list.prepend(...column.items(12));
        column.list.append(...column.items(12));

        column.setProps({ selectedIndex: 0 });
        column.foundation.syncSelectedIndex(0, 11);
        expect(column.wrapper.scrollTop).toBe(24 * 36 - 72);
        column.foundation.destroy();
        column.wrapper.remove();
    });

    describe('wheel 模式', () => {
        const wheel = (selectedIndex: number) =>
            createColumn({
                list: Array.from({ length: 20 }, (_, value) => ({ value })),
                selectedIndex,
                cycled: false,
                mode: 'wheel',
                motion: false,
            });
        const press = (key: string) => {
            const event = new KeyboardEvent('keydown', { key, cancelable: true });
            return event;
        };

        it('滚动排入的选中在方向键选中后失效，不再通知过期的项', () => {
            vi.useFakeTimers();
            const column = wheel(5);
            column.foundation.init();
            // the scroll left item 7 under the selector
            Array.from(column.list.children).forEach((li, index) => {
                li.getBoundingClientRect = () => ({ top: (index - 7) * 36 }) as DOMRect;
            });
            column.foundation.handleScroll();

            column.foundation.handleKeyDown(press('ArrowDown'));
            column.setProps({ selectedIndex: 6 });
            column.foundation.syncSelectedIndex(6, 5);
            vi.advanceTimersByTime(200);

            expect(column.notifySelectItem.mock.calls.map(([data]) => data.index)).toEqual([6]);
            column.foundation.destroy();
            column.wrapper.remove();
            vi.useRealTimers();
        });

        it('滚动排入的选中在属主改 selectedIndex 后失效，不再通知过期的项', () => {
            vi.useFakeTimers();
            const column = wheel(5);
            column.foundation.init();
            Array.from(column.list.children).forEach((li, index) => {
                li.getBoundingClientRect = () => ({ top: (index - 7) * 36 }) as DOMRect;
            });
            column.foundation.handleScroll();

            column.setProps({ selectedIndex: 6 });
            column.foundation.syncSelectedIndex(6, 5);
            vi.advanceTimersByTime(200);

            expect(column.notifySelectItem).not.toHaveBeenCalled();
            column.foundation.destroy();
            column.wrapper.remove();
            vi.useRealTimers();
        });

        it('点击选中项后，滚动排入的选中失效', () => {
            vi.useFakeTimers();
            const column = wheel(5);
            column.foundation.init();
            Array.from(column.list.children).forEach((li, index) => {
                li.getBoundingClientRect = () => ({ top: (index - 7) * 36 }) as DOMRect;
            });
            column.foundation.handleScroll();

            column.foundation.selectIndex(6);
            vi.advanceTimersByTime(200);

            expect(column.notifySelectItem.mock.calls.map(([data]) => data.index)).toEqual([6]);
            column.foundation.destroy();
            column.wrapper.remove();
            vi.useRealTimers();
        });

        it('空格不选中项，并阻止原生翻页', () => {
            const column = wheel(5);
            column.foundation.init();
            const event = press(' ');
            column.foundation.handleKeyDown(event);
            expect(event.defaultPrevented).toBe(true);
            expect(column.notifySelectItem).not.toHaveBeenCalled();
            column.foundation.destroy();
            column.wrapper.remove();
        });
    });
});
