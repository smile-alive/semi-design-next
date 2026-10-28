import React, { StrictMode, type ReactNode } from 'react';
import { render, act, screen } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { mockResizeObserver } from '@test/utils/react';
import OverflowList, { type OverflowItem, type OverflowListProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-overflow-list`;
const keys = ['alarm', 'bookmark', 'camera', 'duration', 'edit', 'folder'];
const items = keys.map((key) => ({ key }));

// Returns a function that reports `width` for an observed element, the only size the list reads.
function stubResizeObserver() {
    const observer = mockResizeObserver();
    return (element: Element, width: number) => observer.fire(element, [{ target: { clientWidth: width }, contentRect: { width } }]);
}

// Records which nodes each observer watches; `intersect` reports visibility by scroll key to every live observer.
function stubIntersectionObserver() {
    const observers = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            callback: (entries: unknown[]) => void;
            options: IntersectionObserverInit;
            elements: Set<Element>;
            constructor(callback: (entries: unknown[]) => void, options: IntersectionObserverInit) {
                this.callback = callback;
                this.options = options;
                this.elements = new Set();
                observers.push(this);
            }
            observe(element: Element) {
                this.elements.add(element);
            }
            unobserve(element: Element) {
                this.elements.delete(element);
            }
            disconnect() {
                this.elements.clear();
            }
            takeRecords() {
                return [];
            }
        }
    );
    const live = () => observers.filter((observer) => observer.elements.size > 0);
    return {
        observers,
        live,
        observed: () => live().flatMap((observer) => [...observer.elements]),
        intersect: (visibility: Record<string, boolean>) =>
            act(() => {
                live().forEach((observer) =>
                    observer.callback(
                        [...observer.elements].map((target) => ({
                            target,
                            isIntersecting: Boolean(visibility[(target as HTMLElement).dataset.scrollkey]),
                            boundingClientRect: { y: 0 },
                        }))
                    )
                );
            }),
    };
}

const getList = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${prefixCls}`);
const getItems = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`)];
const plusRenderer = (overflow) => (overflow.length ? <span>+{overflow.length}</span> : null);

type ScrollRenderer = NonNullable<Extract<OverflowListProps, { renderMode: 'scroll' }>['overflowRenderer']>;
// one node for each side, showing how many items it holds
const sidesRenderer: ScrollRenderer = ([start, end]) => [<span key="start">{`overflow-0:${start.length}`}</span>, <span key="end">{`overflow-1:${end.length}`}</span>];
const modeProps = (renderMode: 'collapse' | 'scroll'): OverflowListProps => (renderMode === 'scroll' ? { renderMode, overflowRenderer: () => [null, null] } : { renderMode });

// Reports the container width, then every rendered item's width, the order a browser reports them after mount
function measure(resize, container, containerWidth, itemWidth = 50) {
    resize(getList(container), containerWidth);
    getItems(container).forEach((item) => resize(item, itemWidth));
}

describe('OverflowList', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('类型：overflowRenderer 的签名按 renderMode 区分', () => {
        type Sides = [OverflowItem[], OverflowItem[]];
        expectTypeOf<{ overflowRenderer: (items: OverflowItem[]) => ReactNode }>().toExtend<OverflowListProps>();
        expectTypeOf<{
            renderMode: 'scroll';
            overflowRenderer: (sides: Sides) => [ReactNode, ReactNode];
        }>().toExtend<OverflowListProps>();
        expectTypeOf<{
            renderMode: 'scroll';
            overflowRenderer: (items: OverflowItem[]) => ReactNode;
        }>().not.toExtend<OverflowListProps>();
        expectTypeOf<{
            renderMode: 'scroll';
            overflowRenderer: (sides: Sides) => ReactNode;
        }>().not.toExtend<OverflowListProps>();
    });

    it('类型：不接受 children，内容由 visibleItemRenderer 与 overflowRenderer 给出', () => {
        expectTypeOf<'children'>().not.toExtend<keyof OverflowListProps>();
    });

    it('类型：泛型参数决定 items 与渲染函数的参数类型，默认 OverflowItem', () => {
        type Row = { key: string; label: string };
        type RowProps = OverflowListProps<Row>;
        expectTypeOf<RowProps['items']>().toEqualTypeOf<Row[] | undefined>();
        expectTypeOf<Parameters<NonNullable<RowProps['visibleItemRenderer']>>[0]>().toEqualTypeOf<Row>();
        expectTypeOf<Parameters<NonNullable<Extract<RowProps, { renderMode?: 'collapse' }>['overflowRenderer']>>[0]>().toEqualTypeOf<Row[]>();
        expectTypeOf<Parameters<NonNullable<Extract<RowProps, { renderMode: 'scroll' }>['overflowRenderer']>>[0]>().toEqualTypeOf<[Row[], Row[]]>();
        expectTypeOf<OverflowListProps['items']>().toEqualTypeOf<OverflowItem[] | undefined>();
        render(<OverflowList<Row> items={[{ key: 'a', label: 'A' }]} overflowRenderer={(rest) => <span>{rest.length}</span>} visibleItemRenderer={(item) => <span>{item.label}</span>} />);
    });

    it('渲染 scroll 模式', () => {
        const { container } = render(<OverflowList items={[{ key: 'alarm' }, { key: 'bookmark' }, { key: 'camera' }, { key: 'duration' }]} overflowRenderer={() => [null, null]} visibleItemRenderer={(item) => <div>{item.key}</div>} renderMode="scroll" />);
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`);
        expect(list).not.toBeNull();
        const scrollWrapper = list.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(scrollWrapper).toHaveTextContent('alarmbookmarkcameraduration');
    });

    it('scroll 模式不传 overflowRenderer 时正常渲染 items', () => {
        const { container } = render(<OverflowList items={[{ key: 'alarm' }, { key: 'bookmark' }]} visibleItemRenderer={(item) => <div>{item.key}</div>} renderMode="scroll" />);
        const scrollWrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(scrollWrapper).toHaveTextContent('alarmbookmark');
    });

    it('首次测量后 items 更新时，collapse 内容保持可见', () => {
        const resize = stubResizeObserver();
        const renderList = (items) => <OverflowList items={items} overflowRenderer={() => null} visibleItemRenderer={(item) => <div>{item.key}</div>} />;
        const { container, rerender } = render(renderList([{ key: 'alarm' }, { key: 'bookmark' }]));
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`);
        expect(list).toHaveStyle({ visibility: 'hidden' });

        resize(list, 300);
        container.querySelectorAll(`.${BASE_CLASS_PREFIX}-overflow-list-item`).forEach((item) => resize(item, 50));
        expect(list).toHaveStyle({ visibility: 'visible' });

        rerender(renderList([{ key: 'alarm' }, { key: 'bookmark' }, { key: 'camera' }]));
        expect(list).toHaveStyle({ visibility: 'visible' });
        expect(list).toHaveTextContent('alarmbookmarkcamera');
    });

    it('collapse: 渲染带 className 与 style 的根元素，每个 item 放在 item div 中', () => {
        const { container } = render(<OverflowList className="custom" style={{ color: 'red' }} items={items} visibleItemRenderer={(item) => <span>{item.key}</span>} />);
        const list = getList(container);
        expect(list).toHaveClass('custom');
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)', maxWidth: '100%', visibility: 'hidden' });
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys);
        expect(container.querySelector(`.${prefixCls}-scroll-wrapper`)).toBeNull();
    });

    it('collapse: 容器变窄或变宽时，放不下的 items 在 overflow 与可见区之间移动', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const { container } = render(<OverflowList items={items} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} onOverflow={onOverflow} />);
        measure(resize, container, 300);
        expect(getList(container)).toHaveStyle({ visibility: 'visible' });
        expect(getList(container)).toHaveTextContent(keys.join(''));
        expect(onOverflow).not.toHaveBeenCalled();

        resize(getList(container), 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['alarm', 'bookmark']);
        expect(container.querySelector(`.${prefixCls}-overflow`)).toHaveTextContent('+4');
        expect(onOverflow).toHaveBeenCalledTimes(1);
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(keys.slice(2));

        resize(container.querySelector(`.${prefixCls}-overflow`), 30);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['alarm']);
        expect(onOverflow).toHaveBeenCalledTimes(2);
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(keys.slice(1));

        resize(getList(container), 125);
        expect(onOverflow).toHaveBeenCalledTimes(2);

        resize(getList(container), 400);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys);
        expect(onOverflow).toHaveBeenCalledTimes(3);
        expect(onOverflow.mock.lastCall[0]).toEqual([]);
    });

    it('collapse: 即使放不下，也保持 minVisibleItems 可见', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const { container } = render(<OverflowList items={items} minVisibleItems={3} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} onOverflow={onOverflow} />);
        measure(resize, container, 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['alarm', 'bookmark', 'camera']);
        expect(screen.getByText('+3')).toBeInTheDocument();
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(keys.slice(3));
    });

    it('collapse: collapseFrom 为 start 时保留最后的 items，并把 overflow 渲染在它们之前', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const { container } = render(<OverflowList collapseFrom="start" items={items} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} onOverflow={onOverflow} />);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys.toReversed());
        measure(resize, container, 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['edit', 'folder']);
        expect(getList(container).firstElementChild).toHaveClass(`${prefixCls}-overflow`);
        expect(getList(container)).toHaveTextContent('+4editfolder');
        expect(onOverflow).toHaveBeenCalledTimes(1);
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(keys.slice(0, 4));
    });

    it('collapse: collapseFrom 为 start 且 items 不带 key 时，渲染函数的 index 始终是项在 items 中的位置', () => {
        const resize = stubResizeObserver();
        const plain = keys.map((name) => ({ name }));
        const calls: Array<[string, number]> = [];
        const { container } = render(
            <OverflowList
                collapseFrom="start"
                items={plain}
                overflowRenderer={plusRenderer}
                visibleItemRenderer={(item, index) => {
                    calls.push([item.name, index]);
                    return <span>{item.name}</span>;
                }}
            />
        );
        measure(resize, container, 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['edit', 'folder']);
        expect(calls.length).toBeGreaterThan(6);
        calls.forEach(([name, index]) => expect(index).toBe(keys.indexOf(name)));
    });

    it('collapse: 测量后把 collapseFrom 从 end 改为 start，按已有宽度从另一端重新计算，渲染函数的 index 仍是项在 items 中的位置', () => {
        const resize = stubResizeObserver();
        const plain = keys.map((name) => ({ name }));
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const renderList = (collapseFrom: 'start' | 'end') => <OverflowList collapseFrom={collapseFrom} items={plain} overflowRenderer={plusRenderer} visibleItemRenderer={(item, index) => <span>{`${index}:${item.name}`}</span>} onOverflow={onOverflow} />;
        const { container, rerender } = render(renderList('end'));
        measure(resize, container, 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['0:alarm', '1:bookmark']);
        rerender(renderList('start'));
        expect(getItems(container).map((item) => item.textContent)).toEqual(['4:edit', '5:folder']);
        expect(onOverflow.mock.lastCall[0].map((item) => item.name)).toEqual(keys.slice(0, 4));
    });

    it('collapse: items 增加新项而旧项沿用 key 时，只有新项上报宽度也能完成计算', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const renderList = (list: OverflowItem[]) => <OverflowList items={list} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} onOverflow={onOverflow} />;
        const { container, rerender } = render(renderList(items.slice(0, 2)));
        measure(resize, container, 120);
        expect(getItems(container)).toHaveLength(2);

        rerender(renderList(items.slice(0, 3)));
        // a and b keep their boxes, which are not observed again
        resize(getItems(container)[2], 50);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['alarm', 'bookmark']);
        expect(screen.getByText('+1')).toBeInTheDocument();
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(['camera']);
    });

    it('collapse: overflowRenderer 返回字符串或数字时也测量其宽度', () => {
        const resize = stubResizeObserver();
        const { container } = render(<OverflowList items={items} overflowRenderer={(overflow) => `+${overflow.length}`} visibleItemRenderer={(item) => <span>{item.key}</span>} />);
        measure(resize, container, 120);
        const overflowNode = container.querySelector(`.${prefixCls}-overflow`);
        expect(overflowNode).toHaveTextContent('+4');
        // the node's width counts against the items: 50 + 50 + 30 fits 130 but not 120
        resize(overflowNode, 30);
        expect(getItems(container).map((item) => item.textContent)).toEqual(['alarm']);
    });

    it.each(['start', 'end'] as const)('collapse: 同一个对象在 items 中出现两次时，collapseFrom 为 %s，渲染函数收到各自的位置', (collapseFrom) => {
        const resize = stubResizeObserver();
        const shared = { name: 'x' };
        const { container } = render(<OverflowList collapseFrom={collapseFrom} items={[shared, { name: 'y' }, shared]} overflowRenderer={plusRenderer} visibleItemRenderer={(item, index) => <span>{`${index}:${item.name}`}</span>} />);
        const texts = () => getItems(container).map((item) => item.textContent);
        expect(texts()).toEqual(collapseFrom === 'end' ? ['0:x', '1:y', '2:x'] : ['2:x', '1:y', '0:x']);
        measure(resize, container, 120);
        expect(texts()).toEqual(collapseFrom === 'end' ? ['0:x', '1:y'] : ['1:y', '2:x']);
    });

    it('collapse: 只改 itemKey 时丢弃按旧 key 记下的宽度，按新 key 重新测量', () => {
        const resize = stubResizeObserver();
        const rows = keys.map((key, index) => ({ key, id: `id-${index}` }));
        const renderList = (itemKey: string) => <OverflowList itemKey={itemKey} items={rows} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} />;
        const { container, rerender } = render(renderList('key'));
        measure(resize, container, 300);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys);

        rerender(renderList('id'));
        // new keys remount the measured boxes; their widths are all that counts now
        getItems(container).forEach((item) => resize(item, 30));
        resize(getList(container), 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys.slice(0, 4));
    });

    it('collapse: 有项溢出时只改 itemKey，全部项按新 key 重新测量，之后容器变宽能展开全部', () => {
        const resize = stubResizeObserver();
        const rows = keys.map((key, index) => ({ key, id: `id-${index}` }));
        const renderList = (itemKey: string) => <OverflowList itemKey={itemKey} items={rows} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} />;
        const { container, rerender } = render(renderList('key'));
        measure(resize, container, 120);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys.slice(0, 2));

        rerender(renderList('id'));
        // the widths kept for the collapsed items belong to the old keys, so every item is rendered to be measured
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys);
        getItems(container).forEach((item) => resize(item, 50));
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys.slice(0, 2));
        resize(getList(container), 400);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys);
    });

    it.each(['collapse', 'scroll'] as const)('%s: 传入 aria-label 或 aria-labelledby 时根元素是有名称的 group', (renderMode) => {
        const { container } = render(<OverflowList aria-label="tags" items={items} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} {...modeProps(renderMode)} />);
        // the collapse list is visibility:hidden until measured, which role queries skip
        expect(getList(container)).toHaveAttribute('role', 'group');
        expect(getList(container)).toHaveAttribute('aria-label', 'tags');
    });

    it('没有名称时根元素不加 role', () => {
        const { container } = render(<OverflowList items={items} />);
        expect(getList(container)).not.toHaveAttribute('role');
    });

    it('collapse: collapseFrom 为 end 时把 overflow 渲染在 items 之后', () => {
        const resize = stubResizeObserver();
        const { container } = render(<OverflowList items={items} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} />);
        measure(resize, container, 120);
        expect(getList(container).lastElementChild).toHaveClass(`${prefixCls}-overflow`);
        expect(getList(container)).toHaveTextContent('alarmbookmark+4');
    });

    it('collapse: 把 overflowRenderer 返回的数组包裹在一个被测量的 overflow 节点中', () => {
        const resize = stubResizeObserver();
        const { container } = render(<OverflowList items={items} overflowRenderer={(overflow) => overflow.map((item) => <i key={item.key}>{item.key}</i>)} visibleItemRenderer={(item) => <span>{item.key}</span>} />);
        measure(resize, container, 120);
        const overflowNodes = container.querySelectorAll(`.${prefixCls}-overflow`);
        expect(overflowNodes).toHaveLength(1);
        expect(overflowNodes[0]).toHaveTextContent('cameradurationeditfolder');
    });

    it('collapse: items 变化后先显示所有新 item，再根据新宽度重新计算', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const renderList = (list) => <OverflowList items={list} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} onOverflow={onOverflow} />;
        const { container, rerender } = render(renderList(items));
        measure(resize, container, 120);
        expect(onOverflow).toHaveBeenCalledTimes(1);

        const next = ['one', 'two', 'three'].map((key) => ({ key }));
        rerender(renderList(next));
        expect(getItems(container).map((item) => item.textContent)).toEqual(['one', 'two', 'three']);
        expect(getList(container)).toHaveStyle({ visibility: 'visible' });

        getItems(container).forEach((item) => resize(item, 50));
        expect(getItems(container).map((item) => item.textContent)).toEqual(['one', 'two']);
        expect(screen.getByText('+1')).toBeInTheDocument();
        expect(onOverflow).toHaveBeenCalledTimes(2);
        expect(onOverflow.mock.lastCall[0].map((item) => item.key)).toEqual(['three']);
    });

    it('scroll: 保留 renderer 挂在其元素上的 ref', () => {
        const ref = vi.fn<(element: HTMLDivElement | null) => void>();
        const objectRef = React.createRef<HTMLDivElement>();
        render(
            <OverflowList
                items={items.slice(0, 2)}
                overflowRenderer={() => [null, null]}
                visibleItemRenderer={(item) => (
                    <div key={item.key} ref={item.key === 'alarm' ? ref : objectRef}>
                        {item.key}
                    </div>
                )}
                renderMode="scroll"
            />
        );
        expect(ref).toHaveBeenCalledWith(screen.getByText('alarm'));
        expect(objectRef.current).toBe(screen.getByText('bookmark'));
    });

    it.each(['collapse', 'scroll'] as const)('%s: 没有 items 时渲染空列表', (renderMode) => {
        const { container } = render(<OverflowList {...modeProps(renderMode)} />);
        expect(getList(container)).toBeInTheDocument();
        expect(getItems(container)).toHaveLength(0);
    });

    it('collapse: 深度相等的 items 数组或 style 不会重置，style 变化时立即重新计算', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const renderList = (list, style) => <OverflowList style={style} items={list} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <span>{item.key}</span>} onOverflow={onOverflow} />;
        const { container, rerender } = render(renderList(items, { color: 'red' }));
        measure(resize, container, 120);
        const visibleKeys = () => getItems(container).map((item) => item.textContent);
        expect(visibleKeys()).toEqual(['alarm', 'bookmark']);

        const equalItems = keys.map((key) => ({ key }));
        rerender(renderList(equalItems, { color: 'red' }));
        expect(visibleKeys()).toEqual(['alarm', 'bookmark']);

        // the reset and the recompute from the kept widths land before the test can observe them
        rerender(renderList(items, { color: 'blue' }));
        expect(visibleKeys()).toEqual(['alarm', 'bookmark']);
        expect(getList(container)).toHaveStyle({ color: 'rgb(0, 0, 255)', visibility: 'visible' });
        expect(onOverflow).toHaveBeenCalledTimes(1);
    });

    it('scroll: items 渲染在 wrapper 中，两个 overflow 节点位于其两侧', () => {
        const overflowRenderer = vi.fn<ScrollRenderer>(sidesRenderer);
        const { container } = render(<OverflowList className="custom" wrapperClassName="wrapper" style={{ color: 'red' }} wrapperStyle={{ gap: '4px' }} items={items} overflowRenderer={overflowRenderer} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" />);
        const list = getList(container);
        expect(list).toHaveClass('custom');
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(list.style.visibility).toBe('');
        const wrapper = container.querySelector(`.${prefixCls}-scroll-wrapper`);
        expect(wrapper).toHaveClass('wrapper');
        expect(wrapper).toHaveStyle({ gap: '4px' });
        expect([...wrapper.children].map((child) => (child as HTMLElement).dataset.scrollkey)).toEqual(keys);
        expect([...list.children].map((child) => child.textContent)).toEqual(['overflow-0:0', keys.join(''), 'overflow-1:0']);
        expect(overflowRenderer.mock.lastCall[0]).toEqual([[], []]);
    });

    it.each<[NonNullable<OverflowListProps['overflowRenderDirection']>, string[]]>([
        ['start', ['overflow-0', 'overflow-1', 'wrapper']],
        ['end', ['wrapper', 'overflow-0', 'overflow-1']],
    ])('scroll: overflowRenderDirection 为 %s 时，两个 overflow 节点都放在该侧', (direction, order) => {
        const { container } = render(<OverflowList items={items} overflowRenderDirection={direction} overflowRenderer={() => [<span key="start">overflow-0</span>, <span key="end">overflow-1</span>]} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" />);
        expect([...getList(container).children].map((child) => (child.classList.contains(`${prefixCls}-scroll-wrapper`) ? 'wrapper' : child.textContent))).toEqual(order);
    });

    it('scroll: 上报各侧的相交状态与 overflow', () => {
        const io = stubIntersectionObserver();
        const onIntersect = vi.fn<NonNullable<OverflowListProps['onIntersect']>>();
        const onVisibleStateChange = vi.fn<NonNullable<OverflowListProps['onVisibleStateChange']>>();
        const overflowRenderer = vi.fn<ScrollRenderer>(sidesRenderer);
        render(<OverflowList items={items} overflowRenderer={overflowRenderer} threshold={0.5} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" onIntersect={onIntersect} onVisibleStateChange={onVisibleStateChange} />);
        expect(io.live()).toHaveLength(1);
        expect(io.live()[0].options).toMatchObject({ threshold: 0.5 });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(keys);

        io.intersect({ bookmark: true, camera: true, duration: true });
        expect(onIntersect).toHaveBeenCalledTimes(1);
        const res = onIntersect.mock.lastCall[0];
        expect(Object.keys(res)).toEqual(keys);
        expect(res.alarm.isIntersecting).toBe(false);
        expect(res.camera.target).toBe(screen.getByText('camera'));
        expect(onVisibleStateChange).toHaveBeenCalledTimes(1);
        expect([...onVisibleStateChange.mock.lastCall[0]]).toEqual(keys.map((key) => [key, key !== 'alarm' && key !== 'edit' && key !== 'folder']));
        expect(screen.getByText('overflow-0:1')).toBeInTheDocument();
        expect(screen.getByText('overflow-1:2')).toBeInTheDocument();
        expect(overflowRenderer.mock.lastCall[0].map((side) => side.map((item) => item.key))).toEqual([['alarm'], ['edit', 'folder']]);

        io.intersect({});
        expect(screen.getByText('overflow-0:1')).toBeInTheDocument();
        expect(screen.getByText('overflow-1:2')).toBeInTheDocument();
    });

    it('scroll: items 变化后观察新节点，卸载时停止观察', () => {
        const io = stubIntersectionObserver();
        const renderList = (list: OverflowItem[]) => <OverflowList items={list} overflowRenderer={sidesRenderer} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" />;
        const { rerender, unmount } = render(renderList(items));
        io.intersect({ alarm: true, bookmark: true });
        expect(screen.getByText('overflow-1:4')).toBeInTheDocument();

        rerender(renderList(keys.map((key) => ({ key }))));
        expect(io.live()).toHaveLength(1);
        expect(screen.getByText('overflow-1:4')).toBeInTheDocument();

        const next = ['alarm', 'one', 'two'].map((key) => ({ key }));
        rerender(renderList(next));
        expect(io.live()).toHaveLength(1);
        expect(io.observed()).toEqual(['alarm', 'one', 'two'].map((key) => screen.getByText(key)));
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();
        expect(screen.getByText('overflow-1:0')).toBeInTheDocument();

        io.intersect({ alarm: true });
        expect(screen.getByText('overflow-1:2')).toBeInTheDocument();

        unmount();
        expect(io.observed()).toEqual([]);
    });

    it('scroll: StrictMode 下每个 item 只有一个 observer 在观察', () => {
        const io = stubIntersectionObserver();
        const onIntersect = vi.fn<NonNullable<OverflowListProps['onIntersect']>>();
        render(
            <StrictMode>
                <OverflowList items={items} overflowRenderer={() => [null, null]} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" onIntersect={onIntersect} />
            </StrictMode>
        );
        expect(io.live()).toHaveLength(1);
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(keys);
        io.intersect({ alarm: true });
        expect(onIntersect).toHaveBeenCalledTimes(1);
    });

    it('renderMode 在 collapse 与 scroll 之间切换', () => {
        const io = stubIntersectionObserver();
        const renderList = (renderMode) => <OverflowList items={items} overflowRenderer={() => (renderMode === 'scroll' ? [null, null] : null)} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode={renderMode} />;
        const { container, rerender } = render(renderList('scroll'));
        expect(io.observed()).toHaveLength(6);

        rerender(renderList('collapse'));
        expect(io.observed()).toEqual([]);
        expect(getItems(container).map((item) => item.textContent)).toEqual(keys);
        expect(container.querySelector(`.${prefixCls}-scroll-wrapper`)).toBeNull();

        rerender(renderList('scroll'));
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(keys);
        expect(getItems(container)).toEqual([]);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { OverflowList: { renderMode: 'scroll' } };
        const { container } = render(<OverflowList items={items} overflowRenderer={() => [null, null]} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} />);
        expect(container.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveTextContent(keys.join(''));
    });

    it.each(['collapse', 'scroll'] as const)('%s: 把未声明的属性透传到根元素，ref 指向根元素', (renderMode) => {
        const ref = React.createRef<HTMLDivElement>();
        const { container } = render(<OverflowList ref={ref} data-testid="list" aria-label="tags" items={items} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} {...modeProps(renderMode)} />);
        const list = getList(container);
        expect(list).toBe(screen.getByTestId('list'));
        expect(list).toHaveAttribute('aria-label', 'tags');
        expect(ref.current).toBe(list);
    });

    it('collapse: 使用默认 visibleItemRenderer 时 items 不渲染任何内容', () => {
        const { container } = render(<OverflowList items={items} />);
        expect(getItems(container)).toHaveLength(6);
        expect(getList(container)).toHaveTextContent('');
    });

    it('collapse: items 为空数组时不渲染任何项也不报错', () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<NonNullable<OverflowListProps['onOverflow']>>();
        const { container } = render(<OverflowList items={[]} overflowRenderer={plusRenderer} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} onOverflow={onOverflow} />);
        resize(getList(container), 200);
        expect(getItems(container)).toHaveLength(0);
        expect(getList(container)).toHaveStyle({ visibility: 'visible' });
        expect(onOverflow).not.toHaveBeenCalled();
    });

    it('scroll: items 为空数组时不渲染任何项也不报错', () => {
        stubIntersectionObserver();
        const { container } = render(<OverflowList items={[]} overflowRenderer={() => [null, null]} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" />);
        expect(getList(container)).toBeInTheDocument();
        expect(container.querySelectorAll('[data-scrollkey]')).toHaveLength(0);
    });

    it('scroll: 数字 key 也能按相交状态拆分两侧 overflow', () => {
        const io = stubIntersectionObserver();
        const overflowRenderer = vi.fn<ScrollRenderer>(() => [null, null]);
        render(<OverflowList items={[{ key: 1 }, { key: 2 }, { key: 3 }]} overflowRenderer={overflowRenderer} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" />);
        io.intersect({ 2: true });
        expect(overflowRenderer.mock.lastCall[0].map((side) => side.map((item) => item.key))).toEqual([[1], [3]]);
    });

    it('scroll: itemKey 指向其他字段时按该字段拆分两侧 overflow', () => {
        const io = stubIntersectionObserver();
        const overflowRenderer = vi.fn<ScrollRenderer>(() => [null, null]);
        render(<OverflowList itemKey="id" items={[{ id: 'a' }, { id: 'b' }, { id: 'c' }]} overflowRenderer={overflowRenderer} visibleItemRenderer={(item) => <div key={item.id}>{item.id}</div>} renderMode="scroll" />);
        io.intersect({ b: true });
        expect(overflowRenderer.mock.lastCall[0].map((side) => side.map((item) => item.id))).toEqual([['a'], ['c']]);
    });

    it('scroll: visibleItemRenderer 对某项返回 null 时跳过该项而不抛错', () => {
        const { container } = render(<OverflowList items={items} overflowRenderer={() => [null, null]} visibleItemRenderer={(item) => (item.key === 'camera' ? null : <div key={item.key}>{item.key}</div>)} renderMode="scroll" />);
        expect(container.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveTextContent(keys.filter((key) => key !== 'camera').join(''));
    });

    it('scroll: threshold 变化后用新值重建 observer', () => {
        const io = stubIntersectionObserver();
        const renderList = (threshold) => <OverflowList items={items} overflowRenderer={() => [null, null]} threshold={threshold} visibleItemRenderer={(item) => <div key={item.key}>{item.key}</div>} renderMode="scroll" />;
        const { rerender } = render(renderList(0.5));
        rerender(renderList(1));
        expect(io.live()).toHaveLength(1);
        expect(io.live()[0].options).toMatchObject({ threshold: 1 });
        expect(io.observed()).toHaveLength(6);
    });
});
