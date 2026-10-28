import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { scrollIntoViewWithin } from '../../utils/supports';
import { getBarItemKey, getItemKeyByBarItemKey, getTabDataKey } from '../constants';
import TabsFoundation, { type MotionView } from '../foundation';

vi.mock('../../utils/supports', () => ({ scrollIntoViewWithin: vi.fn<() => void>() }));

describe('TabsFoundation.getMotionView', () => {
    const first = TabsFoundation.getMotionView(undefined, { activeKey: 'a', propsActiveKey: undefined, paneKeys: ['a', 'b'] });

    it('挂载时没有上一个键，也不禁用动画', () => {
        expect(first).toEqual({ activeKey: 'a', prevActiveKey: null, propsActiveKey: undefined, paneKeys: ['a', 'b'], forceDisableMotion: false });
    });

    it('键与面板键列表都没变时返回同一个对象', () => {
        expect(TabsFoundation.getMotionView(first, { activeKey: 'a', propsActiveKey: undefined, paneKeys: ['a', 'b'] })).toBe(first);
    });

    it('选中键变化时记录上一个键，选中键不变时沿用', () => {
        const next = TabsFoundation.getMotionView(first, { activeKey: 'b', propsActiveKey: undefined, paneKeys: ['a', 'b'] });
        expect(next.prevActiveKey).toBe('a');
        expect(TabsFoundation.getMotionView(next, { activeKey: 'b', propsActiveKey: undefined, paneKeys: ['a', 'b', 'c'] }).prevActiveKey).toBe('a');
    });

    it('同一次更新里新增并选中的面板不播放动画，之后的更新沿用该结果', () => {
        const added: MotionView = TabsFoundation.getMotionView(first, { activeKey: 'c', propsActiveKey: 'c', paneKeys: ['a', 'b', 'c'] });
        expect(added.forceDisableMotion).toBe(true);
        expect(TabsFoundation.getMotionView(added, { activeKey: 'c', propsActiveKey: 'c', paneKeys: ['a', 'c'] }).forceDisableMotion).toBe(true);
        expect(TabsFoundation.getMotionView(added, { activeKey: 'a', propsActiveKey: 'a', paneKeys: ['a', 'c'] }).forceDisableMotion).toBe(false);
    });
});

describe('TabsFoundation.splitMore', () => {
    const list = ['a', 'b', 'c', 'd'];

    it('数字和 { count } 都把最后 count 项移入菜单', () => {
        expect(TabsFoundation.splitMore(list, 1)).toEqual({ kept: ['a', 'b', 'c'], moved: ['d'] });
        expect(TabsFoundation.splitMore(list, { count: 2 })).toEqual({ kept: ['a', 'b'], moved: ['c', 'd'] });
    });

    it('count 超过长度时全部移入，为 0 或负数时没有移动', () => {
        expect(TabsFoundation.splitMore(list, 9)).toEqual({ kept: [], moved: list });
        expect(TabsFoundation.splitMore(list, 0).moved).toEqual([]);
        expect(TabsFoundation.splitMore(list, -1).moved).toEqual([]);
    });

    it('类型不对时抛错', () => {
        expect(() => TabsFoundation.splitMore(list, 'x' as unknown as number)).toThrow('[Semi Tabs]: invalid tab props format: more');
    });
});

describe('TabsFoundation.isTabsOverflowing', () => {
    const bar = (tops: number[], scrollWidth = 100, clientWidth = 100) => ({ querySelectorAll: () => tops.map((offsetTop) => ({ offsetTop })), scrollWidth, clientWidth }) as unknown as HTMLElement;

    it('页签换行即溢出，纵向布局不看换行', () => {
        expect(TabsFoundation.isTabsOverflowing(bar([0, 0, 30]), 'top')).toBe(true);
        expect(TabsFoundation.isTabsOverflowing(bar([0, 30]), 'left')).toBe(false);
        expect(TabsFoundation.isTabsOverflowing(bar([0]), 'top')).toBe(false);
    });

    it('滚动宽度超出可见宽度 1px 以上才算溢出', () => {
        expect(TabsFoundation.isTabsOverflowing(bar([0, 0], 101, 100), 'top')).toBe(false);
        expect(TabsFoundation.isTabsOverflowing(bar([0, 0], 102, 100), 'left')).toBe(true);
    });
});

describe('TabsFoundation.scrollTabIntoView', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.mocked(scrollIntoViewWithin).mockClear();
    });

    it('按 data-scrollkey 找到页签，只在滚动容器内滚入视野，找不到或没有 bar 时什么都不做', () => {
        vi.stubGlobal('CSS', { escape: (value: string) => value.replace(/"/g, '\\"') });
        const wrapper = {} as HTMLElement;
        const tabEl = { closest: vi.fn<(selector: string) => unknown>(() => wrapper) } as unknown as Element;
        const querySelector = vi.fn<(selector: string) => unknown>((selector) => (selector.includes('"a-bar"') ? tabEl : null));
        const barEl = { querySelector } as unknown as HTMLElement;
        TabsFoundation.scrollTabIntoView(barEl, 'a-bar', 'center', 'auto');
        expect(scrollIntoViewWithin).toHaveBeenCalledExactlyOnceWith(tabEl, wrapper, { behavior: 'auto', block: 'center', inline: 'center' });
        TabsFoundation.scrollTabIntoView(barEl, 'missing-bar');
        TabsFoundation.scrollTabIntoView(null, 'a-bar');
        expect(scrollIntoViewWithin).toHaveBeenCalledTimes(1);
    });

    it('没有 OverflowList 滚动容器时以 bar 作为滚动容器', () => {
        vi.stubGlobal('CSS', { escape: (value: string) => value });
        const tabEl = { closest: () => null } as unknown as Element;
        const barEl = { querySelector: () => tabEl } as unknown as HTMLElement;
        TabsFoundation.scrollTabIntoView(barEl, 'a-bar');
        expect(scrollIntoViewWithin).toHaveBeenCalledExactlyOnceWith(tabEl, barEl, { behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
});

describe('TabsFoundation.readVisibleState', () => {
    it('去掉 -bar 后缀并汇总可见性', () => {
        const { visibleState, isShowInViewport, hasHidden } = TabsFoundation.readVisibleState(
            new Map([
                ['a-bar', true],
                ['b-bar', false],
            ])
        );
        expect([...visibleState]).toEqual([
            ['a', true],
            ['b', false],
        ]);
        expect(isShowInViewport).toBe(true);
        expect(hasHidden).toBe(true);
        expect(TabsFoundation.readVisibleState(new Map([['a-bar', false]])).isShowInViewport).toBe(false);
    });
});

describe('Tabs 的 key 约定', () => {
    it('bar 项 key 可还原，data-tabkey 带固定前缀', () => {
        expect(getItemKeyByBarItemKey(getBarItemKey('a-bar'))).toBe('a-bar');
        expect(getTabDataKey('a')).toBe('semiTaba');
    });
});
