import { describe, expect, it, vi } from 'vite-plus/test';
import OverflowListFoundation, { type OverflowListAdapter, type OverflowListBaseProps, type OverflowListView } from '../foundation';

const items = ['a', 'b', 'c', 'd'].map((key) => ({ key }));
const visible = (...keys: string[]) => new Map(items.map(({ key }) => [key, keys.includes(key)]));
const keysOf = (list: Array<Record<string, any>>) => list.map(({ key }) => key);
/** The view each updateView call leaves, applied in order to `view` */
const viewsOf = (updateView: { mock: { calls: Array<Parameters<OverflowListAdapter['updateView']>> } }, view = OverflowListFoundation.createView({ items })) =>
    updateView.mock.calls.map(([update]) => {
        view = update(view);
        return view;
    });

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
        first: 0,
        step: 1,
        fromStart: false,
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

describe('OverflowListFoundation.syncView', () => {
    const props: OverflowListBaseProps = { items, renderMode: 'collapse' };

    it('items、style、key 与 collapseFrom 都没变时返回原 view', () => {
        const view = OverflowListFoundation.createView(props);
        expect(OverflowListFoundation.syncView({ ...props, items: items.map((item) => ({ ...item })) }, view, 0)).toBe(view);
    });

    it.each<[string, OverflowListBaseProps]>([
        ['items', { ...props, items: items.slice(1) }],
        ['style', { ...props, style: { color: 'red' } }],
        ['itemKey', { ...props, itemKey: () => 'same' }],
        ['collapseFrom', { ...props, collapseFrom: 'start' }],
    ])('%s 变化时重置为测量中的 view', (_, next) => {
        const view = { ...OverflowListFoundation.createView(props), overflowStatus: 'normal' as const };
        expect(OverflowListFoundation.syncView(next, view, 0).overflowStatus).toBe('calculating');
    });
});

describe('OverflowListFoundation.getVisibleItems', () => {
    const entries = (view: OverflowListView) => OverflowListFoundation.getVisibleItems(view, 'key').map(({ key, index }) => [key, index]);

    it('测量中的 start 折叠列表是倒序，settle 后是后缀，下标指回 items', () => {
        const measuring = OverflowListFoundation.resetView({ items, renderMode: 'collapse', collapseFrom: 'start' }, OverflowListFoundation.createView({ items }), 0);
        expect(entries(measuring)).toEqual([
            ['d', 3],
            ['c', 2],
            ['b', 1],
            ['a', 0],
        ]);
        const { foundation, adapter } = createCollapse(['a', 'b', 'c', 'd'], 'start', 160);
        ['a', 'b', 'c', 'd'].forEach((key) => foundation.handleItemResize(key, 50, 0));
        foundation.handleCollapseOverflow();
        expect(entries(viewsOf(adapter.updateView, measuring).at(-1))).toEqual([
            ['c', 2],
            ['d', 3],
        ]);
    });

    it('从末尾折叠时是前缀', () => {
        expect(entries(OverflowListFoundation.resetView({ items, renderMode: 'collapse' }, OverflowListFoundation.createView({ items }), 8))).toEqual([
            ['a', 0],
            ['b', 1],
        ]);
    });
});

describe('OverflowListFoundation.handleIntersect', () => {
    const create = (props: OverflowListBaseProps) => {
        const adapter = {
            getProps: () => props,
            getState: () => new Map<string, boolean>(),
            setState: vi.fn<OverflowListAdapter['setState']>(),
            notifyVisibleStateChange: vi.fn<OverflowListAdapter['notifyVisibleStateChange']>(),
            updateView: vi.fn<OverflowListAdapter['updateView']>(),
            notifyIntersect: vi.fn<OverflowListAdapter['notifyIntersect']>(),
        };
        const foundation = new OverflowListFoundation(adapter as unknown as OverflowListAdapter);
        const entry = (key: string, isIntersecting: boolean) =>
            ({
                target: { getAttribute: (name: string) => (name === 'data-scrollkey' ? key : null) },
                isIntersecting,
                boundingClientRect: { y: 0 },
            }) as unknown as IntersectionObserverEntry;
        return { foundation, adapter, entry };
    };

    it('scroll 模式下可见性变化时更新溢出缓存', () => {
        const { foundation, adapter, entry } = create({ items, renderMode: 'scroll' });
        foundation.handleIntersect([entry('a', false), entry('b', true), entry('c', true), entry('d', false)]);
        const [{ scrollOverflow }] = viewsOf(adapter.updateView);
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

function createCollapse(keys: string[], collapseFrom: 'start' | 'end' = 'end', containerWidth = 310) {
    const props = { items: keys.map((key) => ({ key })), minVisibleItems: 0, collapseFrom };
    const adapter = {
        getProp: (key: keyof typeof props) => props[key],
        getProps: () => props,
        getStates: () => ({ overflowWidth: 30, containerWidth }),
        setState: vi.fn<OverflowListAdapter['setState']>(),
        updateView: vi.fn<OverflowListAdapter['updateView']>(),
        notifyOverflow: vi.fn<OverflowListAdapter['notifyOverflow']>(),
    };
    return { props, adapter, foundation: new OverflowListFoundation(adapter as unknown as OverflowListAdapter) };
}

const calculating = { overflowStatus: 'calculating' } as OverflowListView;

describe('OverflowListFoundation.handleCollapseOverflow', () => {
    it('全部放得下时不计入未渲染的溢出节点的旧宽度', () => {
        const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
        const { adapter, foundation } = createCollapse(keys);
        keys.forEach((key) => foundation.handleItemResize(key, 50, 0));
        foundation.handleCollapseOverflow();
        const [view] = viewsOf(adapter.updateView);
        expect(view.visible).toHaveLength(6);
        expect(view.overflow).toEqual([]);
    });

    it('有项尚未上报宽度时不结算', () => {
        const { adapter, foundation } = createCollapse(['a', 'b']);
        foundation.handleItemResize('a', 50, 0);
        foundation.handleCollapseOverflow();
        expect(adapter.updateView).not.toHaveBeenCalled();
    });
});

describe('OverflowListFoundation.handleItemResize / handleCommit', () => {
    it('宽度变化或上报项数达到 maxCount 时转为测量中，首次上报与同宽重报不转', () => {
        const { adapter, foundation } = createCollapse(['a', 'b']);
        foundation.handleItemResize('a', 50, 3);
        foundation.handleItemResize('a', 50, 3);
        expect(adapter.updateView).not.toHaveBeenCalled();
        foundation.handleItemResize('a', 60, 3);
        foundation.handleItemResize('b', 20, 2);
        const normal = { ...OverflowListFoundation.createView({ items }), overflowStatus: 'normal' as const };
        expect(viewsOf(adapter.updateView, normal).map(({ overflowStatus }) => overflowStatus)).toEqual(['calculating', 'calculating']);
    });

    it('容器与溢出节点的宽度变化时转为测量中', () => {
        const { adapter, foundation } = createCollapse(['a']);
        foundation.handleContainerResize(100);
        foundation.handleOverflowResize(20);
        expect(adapter.setState.mock.calls.map(([state]) => state)).toEqual([{ containerWidth: 100 }, { overflowWidth: 20 }]);
        expect(adapter.updateView).toHaveBeenCalledTimes(2);
    });

    it('测量中的 view 提交后结算，其余状态不结算', () => {
        const { adapter, foundation } = createCollapse(['a']);
        foundation.handleItemResize('a', 50, 0);
        foundation.handleCommit({ overflowStatus: 'normal' } as OverflowListView);
        expect(adapter.updateView).not.toHaveBeenCalled();
        foundation.handleCommit(calculating);
        expect(viewsOf(adapter.updateView)[0].overflowStatus).toBe('normal');
    });

    it('key 变化后丢掉已移除 key 的宽度并清空可见性', () => {
        const { props, adapter, foundation } = createCollapse(['a', 'b']);
        foundation.handleCommit(calculating);
        foundation.handleItemResize('a', 50, 0);
        foundation.handleItemResize('b', 50, 0);
        props.items = [{ key: 'a' }];
        foundation.handleCommit(calculating);
        expect(adapter.setState).toHaveBeenCalledWith({ visibleState: new Map() }, undefined);
        expect(viewsOf(adapter.updateView)[0].visible).toHaveLength(1);
        adapter.updateView.mockClear();
        // b was dropped: reporting it again is a first report, not a size change
        foundation.handleItemResize('b', 50, 0);
        expect(adapter.updateView).not.toHaveBeenCalled();
    });
});
