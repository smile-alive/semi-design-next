import { describe, expect, it, vi } from 'vite-plus/test';
import OverflowListFoundation, { type OverflowListAdapter, type OverflowListBaseProps, type OverflowListView } from '../foundation';

const items = ['a', 'b', 'c', 'd'].map((key) => ({ key }));
const visible = (...keys: string[]) => new Map(items.map(({ key }) => [key, keys.includes(key)]));
const keysOf = (list: Array<Record<string, any>>) => list.map(({ key }) => key);

describe('OverflowListFoundation.getOverflowItem', () => {
    const cache: [Array<Record<string, any>>, Array<Record<string, any>>] = [[{ key: 'cached' }], []];

    it('可见项之前与之后的项分别溢出', () => {
        const [before, after] = OverflowListFoundation.getOverflowItem({ items }, { visibleState: visible('b', 'c'), scrollOverflow: cache });
        expect([keysOf(before), keysOf(after)]).toEqual([['a'], ['d']]);
    });

    it('尚无可见性数据或没有任何可见项时沿用缓存', () => {
        expect(OverflowListFoundation.getOverflowItem({ items }, { scrollOverflow: cache })).toBe(cache);
        expect(OverflowListFoundation.getOverflowItem({ items }, { visibleState: new Map(), scrollOverflow: cache })).toBe(cache);
        expect(OverflowListFoundation.getOverflowItem({ items }, { visibleState: visible(), scrollOverflow: cache })).toBe(cache);
    });
});

describe('OverflowListFoundation.resetView', () => {
    const view: OverflowListView = {
        items,
        style: undefined,
        visible: [],
        overflow: [],
        pivot: 2,
        maxCount: 0,
        overflowStatus: 'normal',
        scrollOverflow: [[items[0]], [items[3]]],
    };

    it('scroll 模式按 key 对齐缓存，已删除的项不再出现在溢出中', () => {
        const next = OverflowListFoundation.resetView({ items: items.slice(1), renderMode: 'scroll' }, view, 100);
        expect(next.scrollOverflow).toEqual([[], [items[3]]]);
        expect(next.visible).toEqual(items.slice(1));
        expect(next.overflow).toEqual([]);
        expect(next.overflowStatus).toBe('calculating');
        expect(next.pivot).toBe(2);
    });

    it('collapse 模式按容器宽度限制首轮渲染数量，从末尾折叠时先渲染最后的项', () => {
        const fromEnd = OverflowListFoundation.resetView({ items, renderMode: 'collapse' }, view, 8);
        expect(fromEnd.maxCount).toBe(2);
        expect([keysOf(fromEnd.visible), keysOf(fromEnd.overflow)]).toEqual([
            ['a', 'b'],
            ['c', 'd'],
        ]);
        const fromStart = OverflowListFoundation.resetView({ items, renderMode: 'collapse', collapseFrom: 'start' }, view, 8);
        expect([keysOf(fromStart.visible), keysOf(fromStart.overflow)]).toEqual([
            ['d', 'c'],
            ['b', 'a'],
        ]);
    });

    it('容器宽度不足一个最小宽度时渲染全部项', () => {
        expect(OverflowListFoundation.resetView({ items, renderMode: 'collapse' }, view, 0).maxCount).toBe(4);
    });
});

describe('OverflowListFoundation.handleIntersect', () => {
    const create = (props: OverflowListBaseProps) => {
        const adapter = {
            getProps: () => props,
            getState: () => new Map<string, boolean>(),
            updateVisibleState: vi.fn<OverflowListAdapter['updateVisibleState']>(),
            updateView: vi.fn<OverflowListAdapter['updateView']>(),
            notifyIntersect: vi.fn<OverflowListAdapter['notifyIntersect']>(),
        };
        const foundation = new OverflowListFoundation(adapter as unknown as OverflowListAdapter);
        const entry = (key: string, isIntersecting: boolean) =>
            ({
                target: { dataset: { scrollkey: key } },
                isIntersecting,
                boundingClientRect: { y: 0 },
            }) as unknown as IntersectionObserverEntry;
        return { foundation, adapter, entry };
    };

    it('scroll 模式下可见性变化时更新溢出缓存', () => {
        const { foundation, adapter, entry } = create({ items, renderMode: 'scroll' });
        foundation.handleIntersect([entry('a', false), entry('b', true), entry('c', true), entry('d', false)]);
        const { scrollOverflow } = adapter.updateView.mock.calls[0][0];
        expect([keysOf(scrollOverflow[0]), keysOf(scrollOverflow[1])]).toEqual([['a'], ['d']]);
    });

    it('没有任何可见项时不改缓存', () => {
        const { foundation, adapter, entry } = create({ items, renderMode: 'scroll' });
        foundation.handleIntersect([entry('a', false), entry('b', false)]);
        expect(adapter.updateView).not.toHaveBeenCalled();
    });

    it('collapse 模式不维护溢出缓存', () => {
        const { foundation, adapter, entry } = create({ items, renderMode: 'collapse' });
        foundation.handleIntersect([entry('a', true)]);
        expect(adapter.updateView).not.toHaveBeenCalled();
    });
});

function createCollapse(keys: string[]) {
    const adapter = {
        getProps: () => ({ items: keys.map((key) => ({ key })), minVisibleItems: 0 }),
        getStates: () => ({ overflowWidth: 30, containerWidth: 310 }),
        setState: vi.fn<OverflowListAdapter['setState']>(),
        updateView: vi.fn<OverflowListAdapter['updateView']>(),
        notifyOverflow: vi.fn<OverflowListAdapter['notifyOverflow']>(),
    };
    return { adapter, foundation: new OverflowListFoundation(adapter as unknown as OverflowListAdapter) };
}

describe('OverflowListFoundation.handleCollapseOverflow', () => {
    it('全部放得下时不计入未渲染的溢出节点的旧宽度', () => {
        const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
        const { adapter, foundation } = createCollapse(keys);
        keys.forEach((key) => foundation.recordItemSize(key, 50, 0));
        foundation.handleCollapseOverflow();
        const view = adapter.updateView.mock.calls[0][0];
        expect(view.visible).toHaveLength(6);
        expect(view.overflow).toEqual([]);
    });

    it('有项尚未上报宽度时不结算', () => {
        const { adapter, foundation } = createCollapse(['a', 'b']);
        foundation.recordItemSize('a', 50, 0);
        foundation.handleCollapseOverflow();
        expect(adapter.updateView).not.toHaveBeenCalled();
    });
});

describe('OverflowListFoundation.recordItemSize / handleKeysChange', () => {
    it('宽度变化或上报项数达到 maxCount 时要求重新测量，首次上报与同宽重报不要求', () => {
        const { foundation } = createCollapse(['a', 'b']);
        expect(foundation.recordItemSize('a', 50, 3)).toBe(false);
        expect(foundation.recordItemSize('a', 50, 3)).toBe(false);
        expect(foundation.recordItemSize('a', 60, 3)).toBe(true);
        expect(foundation.recordItemSize('b', 20, 2)).toBe(true);
    });

    it('key 变化后丢掉已移除 key 的宽度并清空可见性', () => {
        const { adapter, foundation } = createCollapse(['a']);
        foundation.recordItemSize('a', 50, 0);
        foundation.recordItemSize('b', 50, 0);
        foundation.handleKeysChange(['a']);
        expect(adapter.setState).toHaveBeenCalledWith({ visibleState: new Map() }, undefined);
        foundation.handleCollapseOverflow();
        expect(adapter.updateView.mock.calls[0][0].visible).toHaveLength(1);
        // b was dropped: reporting it again is a first report, not a size change
        expect(foundation.recordItemSize('b', 50, 0)).toBe(false);
    });
});

describe('OverflowListFoundation.getVisibleLayout', () => {
    const layoutItems = ['a', 'b', 'c', 'd'].map((key) => ({ key }));

    it('测量中的 start 折叠列表是倒序，其余为前缀', () => {
        expect(OverflowListFoundation.getVisibleLayout({ items: layoutItems, visible: layoutItems }, true, true)).toEqual({ first: 3, step: -1, fromStart: true });
        expect(OverflowListFoundation.getVisibleLayout({ items: layoutItems, visible: layoutItems.slice(0, 2) }, false, false)).toEqual({ first: 0, step: 1, fromStart: false });
    });

    it('settle 后的 start 折叠列表是后缀', () => {
        expect(OverflowListFoundation.getVisibleLayout({ items: layoutItems, visible: layoutItems.slice(2) }, true, false)).toEqual({ first: 2, step: 1, fromStart: true });
    });
});
