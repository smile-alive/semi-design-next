import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { scrollIntoViewWithin } from '@fibrae/semi-foundation/utils';
import TabBarFoundation, { type TabBarAdapter, type TabBarBaseProps, type TabBarState } from '../tab-bar-foundation';

vi.mock('@fibrae/semi-foundation/utils/supports', () => ({ scrollIntoViewWithin: vi.fn<() => void>() }));

const list = ['a', 'b', 'c'].map((itemKey) => ({ itemKey, tab: itemKey }));

function setup(initial: TabBarBaseProps = {}) {
    let props: TabBarBaseProps = { collapsible: 'auto', activeKey: 'a', list, ...initial };
    let state: TabBarState = TabBarFoundation.getInitialState();
    const bar = {
        clientWidth: 100,
        scrollWidth: 100,
        querySelectorAll: () => [],
        querySelector: (selector: string) => ({ selector, closest: () => null }),
    };
    const notifyVisibleTabsChange = vi.fn<(visibleState: Map<string, boolean>) => void>();
    const foundation = new TabBarFoundation({
        getProps: () => props,
        getProp: (key: keyof TabBarBaseProps) => props[key],
        getState: (key: keyof TabBarState) => state[key],
        setState: (partial: Partial<TabBarState>) => {
            state = { ...state, ...partial };
        },
        getBarElement: () => bar as unknown as HTMLElement,
        notifyVisibleTabsChange,
    } as unknown as TabBarAdapter);
    const update = (next: TabBarBaseProps) => {
        const prev = props;
        props = { ...props, ...next };
        foundation.handlePropsChange(prev);
    };
    return { foundation, bar, notifyVisibleTabsChange, update, collapsed: () => state.shouldCollapse };
}

const scrolledKeys = () => vi.mocked(scrollIntoViewWithin).mock.calls.map(([tab]) => /"(.*)"/.exec((tab as unknown as { selector: string }).selector)?.[1]);

describe('TabBarFoundation', () => {
    beforeEach(() => {
        vi.stubGlobal('CSS', { escape: (value: string) => value });
        vi.mocked(scrollIntoViewWithin).mockClear();
    });

    it('checkOverflow 只在 collapsible="auto" 且溢出时打开折叠', () => {
        const fixed = setup({ collapsible: true });
        fixed.bar.scrollWidth = 200;
        fixed.foundation.checkOverflow();
        expect(fixed.collapsed()).toBe(false);

        const auto = setup();
        auto.foundation.checkOverflow();
        expect(auto.collapsed()).toBe(false);
        auto.bar.scrollWidth = 200;
        auto.foundation.checkOverflow();
        expect(auto.collapsed()).toBe(true);
    });

    it('可见状态：首次进入视口滚动一次，全部不可见不改折叠，宽度回到折叠时的宽度以上且没有隐藏项才退出折叠', () => {
        const { foundation, bar, notifyVisibleTabsChange, collapsed } = setup();
        bar.scrollWidth = 200;
        foundation.checkOverflow();

        foundation.handleVisibleStateChange(new Map([['a-bar', false]]));
        expect(collapsed()).toBe(true);
        expect(scrolledKeys()).toEqual([]);

        foundation.handleVisibleStateChange(
            new Map([
                ['a-bar', true],
                ['b-bar', true],
            ])
        );
        expect(scrolledKeys()).toEqual(['a-bar']);
        expect(collapsed()).toBe(true);
        expect([...(notifyVisibleTabsChange.mock.lastCall?.[0] ?? [])]).toEqual([
            ['a', true],
            ['b', true],
        ]);

        bar.clientWidth = 150;
        foundation.handleVisibleStateChange(
            new Map([
                ['a-bar', true],
                ['b-bar', false],
            ])
        );
        expect(collapsed()).toBe(true);
        foundation.handleVisibleStateChange(new Map([['a-bar', true]]));
        expect(collapsed()).toBe(false);
        expect(scrolledKeys()).toEqual(['a-bar']);
    });

    it('箭头每次点击滚到下一个隐藏项，不修改传入的数组，新数组重新计数', () => {
        const { foundation } = setup();
        const hidden = [{ itemKey: 'a' }, { itemKey: 'b' }];
        foundation.handleArrowClick(hidden, 'start');
        foundation.handleArrowClick(hidden, 'start');
        foundation.handleArrowClick(hidden, 'start');
        expect(hidden).toHaveLength(2);
        foundation.handleArrowClick([...hidden], 'end');
        expect(scrolledKeys()).toEqual(['b-bar', 'a-bar', 'a-bar']);
    });

    it('activeKey 变化只在折叠时滚动；页签变化清空折叠宽度并重新检查溢出', () => {
        const { foundation, bar, update, collapsed } = setup();
        update({ activeKey: 'b' });
        expect(scrolledKeys()).toEqual([]);

        bar.scrollWidth = 200;
        update({ list: [...list, { itemKey: 'd', tab: 'd' }] });
        expect(collapsed()).toBe(true);
        update({ activeKey: 'c' });
        expect(scrolledKeys()).toEqual(['c-bar']);

        update({ list: [...list, { itemKey: 'd', tab: 'd' }] });
        foundation.handleVisibleStateChange(new Map([['a-bar', true]]));
        expect(collapsed()).toBe(true);
        update({ list: [...list, { itemKey: 'd', tab: 'renamed' }] });
        foundation.handleVisibleStateChange(new Map([['a-bar', true]]));
        expect(collapsed()).toBe(false);
    });

    it('页签列表按键与文字标题比较，元素标题只看键', () => {
        const { list: equals } = TabBarFoundation.propEquals;
        expect(equals([{ itemKey: 'a', tab: {} }], [{ itemKey: 'a', tab: {} }])).toBe(true);
        expect(equals([{ itemKey: 'a', tab: 'x' }], [{ itemKey: 'a', tab: {} }])).toBe(false);
        expect(equals([{ itemKey: 'a', tab: 1 }], [{ itemKey: 'a', tab: 2 }])).toBe(false);
        expect(equals([{ itemKey: 'a' }], [{ itemKey: 'b' }])).toBe(false);
    });
});
