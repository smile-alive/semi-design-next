/** @jsxImportSource vue */
import { nextTick, type ComponentPublicInstance, type VNodeChild } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { mockResizeObserver, render, sleep } from '@test/utils/vue';
import OverflowList, { type OverflowListEmits, type OverflowListItem, type OverflowListItemSlotProps, type OverflowListOverflowSlotProps, type OverflowListProps, type OverflowListSlots } from '..';
import semiGlobal from '../../_utils/semi-global';
import ScrollRefs from './fixtures/scroll-refs.vue';
import Typed from './fixtures/typed.vue';

type ItemSlot = (props: OverflowListItemSlotProps<OverflowListItem>) => VNodeChild;
type OverflowSlot = (props: OverflowListOverflowSlotProps<OverflowListItem>) => VNodeChild;
type OverflowHandler = (items: OverflowListItem[]) => void;

const prefixCls = `${BASE_CLASS_PREFIX}-overflow-list`;
const keys = ['alarm', 'bookmark', 'camera', 'duration', 'edit', 'folder'];
const items = keys.map((key) => ({ key }));

// Returns a function that reports `width` for an observed element, the only size the list reads. The measurement
// spans several updates (resize -> recalculate -> render), so it waits for the one after the report as well.
function stubResizeObserver() {
    const observer = mockResizeObserver();
    return async (element: Element | null, width: number) => {
        await observer.fire(element as Element, [{ target: { clientWidth: width }, contentRect: { width } }]);
        await nextTick();
    };
}

interface StubObserver {
    callback: (entries: unknown[]) => void;
    options: IntersectionObserverInit;
    elements: Set<Element>;
}

function stubIntersectionObserver() {
    const observers: StubObserver[] = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            callback: (entries: unknown[]) => void;
            options: IntersectionObserverInit;
            elements = new Set<Element>();
            constructor(callback: (entries: unknown[]) => void, options: IntersectionObserverInit) {
                this.callback = callback;
                this.options = options;
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
        observed: () => live().flatMap((observer) => [...observer.elements] as HTMLElement[]),
        intersect: async (visibility: Record<string, boolean>) => {
            live().forEach((observer) =>
                observer.callback(
                    [...observer.elements].map((target) => ({
                        target,
                        isIntersecting: Boolean(visibility[(target as HTMLElement).dataset.scrollkey ?? '']),
                        boundingClientRect: { y: 0 },
                    }))
                )
            );
            await nextTick();
        },
    };
}

const getList = (container: Element) => container.querySelector<HTMLElement>(`.${prefixCls}`);
const getItems = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`)];
const itemTexts = (container: Element) => getItems(container).map((item) => item.textContent);
const keyItem: ItemSlot = ({ item }) => <span>{item.key}</span>;
const keyDiv: ItemSlot = ({ item }) => <div>{item.key}</div>;
const plus: OverflowSlot = ({ items: rest }) => (rest.length ? <span>{`+${rest.length}`}</span> : null);
const sides: OverflowSlot = ({ items: rest, position }) => <span>{`overflow-${position === 'start' ? 0 : 1}:${rest.length}`}</span>;

function renderList(props: Partial<OverflowListProps<OverflowListItem>> & Record<string, unknown> = {}, slots: OverflowListSlots<OverflowListItem> | Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
    return render(OverflowList, { props: { items, ...props }, slots: { item: keyItem, ...slots }, attrs });
}

async function measure(resize: ReturnType<typeof stubResizeObserver>, container: Element, containerWidth: number, itemWidth = 50) {
    await resize(getList(container), containerWidth);
    for (const item of getItems(container)) {
        await resize(item, itemWidth);
    }
}

describe('OverflowList', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('类型：泛型参数决定 items、插槽与事件参数的类型，默认 OverflowListItem', () => {
        type Row = { key: string; label: string };
        expectTypeOf<OverflowListProps<Row>['items']>().toEqualTypeOf<Row[] | undefined>();
        expectTypeOf<NonNullable<OverflowListSlots<Row>['item']>>().parameter(0).toEqualTypeOf<{
            item: Row;
            index: number;
        }>();
        expectTypeOf<NonNullable<OverflowListSlots<Row>['overflow']>>().parameter(0).toEqualTypeOf<{
            items: Row[];
            position: 'start' | 'end';
        }>();
        expectTypeOf<OverflowListEmits<Row>['overflow']>().toEqualTypeOf<[overflowItems: Row[]]>();
        const view = render(Typed);
        expect(itemTexts(view.container)).toEqual(['0:ADA', '1:ALAN']);
    });

    it('渲染 scroll 模式', () => {
        const view = renderList({ items: items.slice(0, 4), renderMode: 'scroll' }, { item: keyDiv });
        const list = getList(view.container);
        expect(list).not.toBeNull();
        expect(list?.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveTextContent(/^alarmbookmarkcameraduration$/);
    });

    it('scroll 模式不提供 #overflow 时正常渲染 items', () => {
        const view = renderList({ items: items.slice(0, 2), renderMode: 'scroll' }, { item: keyDiv });
        expect(view.container.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveTextContent(/^alarmbookmark$/);
    });

    it('首次测量后 items 更新时，collapse 内容保持可见', async () => {
        const resize = stubResizeObserver();
        const view = renderList({ items: items.slice(0, 2) }, { item: keyDiv });
        const list = getList(view.container);
        expect(list).toHaveStyle({ visibility: 'hidden' });

        await measure(resize, view.container, 300);
        expect(list).toHaveStyle({ visibility: 'visible' });

        await view.rerender({ items: items.slice(0, 3) });
        expect(list).toHaveStyle({ visibility: 'visible' });
        expect(list).toHaveTextContent(/^alarmbookmarkcamera$/);
    });

    it('collapse: 渲染带 class 与 style 的根元素，每个 item 放在 item div 中', () => {
        const view = renderList({}, {}, { class: 'custom', style: { color: 'red' } });
        const list = getList(view.container);
        expect(list).toHaveClass('custom');
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)', maxWidth: '100%', visibility: 'hidden' });
        expect(itemTexts(view.container)).toEqual(keys);
        expect(view.container.querySelector(`.${prefixCls}-scroll-wrapper`)).toBeNull();
    });

    it('collapse: 容器变窄或变宽时，放不下的 items 在 overflow 与可见区之间移动', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ onOverflow }, { overflow: plus });
        const { container } = view;
        await measure(resize, container, 300);
        expect(getList(container)).toHaveStyle({ visibility: 'visible' });
        expect(getList(container)).toHaveTextContent(keys.join(''));
        expect(onOverflow).not.toHaveBeenCalled();

        await resize(getList(container), 120);
        expect(itemTexts(container)).toEqual(['alarm', 'bookmark']);
        expect(container.querySelector(`.${prefixCls}-overflow`)).toHaveTextContent(/^\+4$/);
        expect(onOverflow).toHaveBeenCalledTimes(1);
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(keys.slice(2));

        await resize(container.querySelector(`.${prefixCls}-overflow`), 30);
        expect(itemTexts(container)).toEqual(['alarm']);
        expect(onOverflow).toHaveBeenCalledTimes(2);
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(keys.slice(1));

        await resize(getList(container), 125);
        expect(onOverflow).toHaveBeenCalledTimes(2);

        await resize(getList(container), 400);
        expect(itemTexts(container)).toEqual(keys);
        expect(onOverflow).toHaveBeenCalledTimes(3);
        expect(onOverflow.mock.lastCall?.[0]).toEqual([]);
    });

    it('collapse: 放宽后刚好放下全部 items 时不再计入已卸载的 overflow 节点宽度', async () => {
        const resize = stubResizeObserver();
        const view = renderList({}, { overflow: plus });
        const { container } = view;
        await measure(resize, container, 120);
        await resize(container.querySelector(`.${prefixCls}-overflow`), 30);
        await resize(getList(container), 300);
        expect(itemTexts(container)).toEqual(keys);
        expect(container.querySelector(`.${prefixCls}-overflow`)).toBeNull();
    });

    it('collapse: 即使放不下，也保持 minVisibleItems 可见', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ minVisibleItems: 3, onOverflow }, { overflow: plus });
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(['alarm', 'bookmark', 'camera']);
        expect(screen.getByText('+3')).toBeInTheDocument();
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(keys.slice(3));
    });

    it('collapse: collapseFrom 为 start 时保留最后的 items，并把 overflow 渲染在它们之前', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const overflow = vi.fn<OverflowSlot>(plus);
        const view = renderList({ collapseFrom: 'start', onOverflow }, { overflow });
        expect(itemTexts(view.container)).toEqual(keys.toReversed());
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(['edit', 'folder']);
        expect(getList(view.container)?.firstElementChild).toHaveClass(`${prefixCls}-overflow`);
        expect(getList(view.container)).toHaveTextContent(/^\+4editfolder$/);
        expect(onOverflow).toHaveBeenCalledTimes(1);
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(keys.slice(0, 4));
        expect(overflow.mock.lastCall?.[0].position).toBe('start');
    });

    it('collapse: collapseFrom 为 end 时把 overflow 渲染在 items 之后', async () => {
        const resize = stubResizeObserver();
        const overflow = vi.fn<OverflowSlot>(plus);
        const view = renderList({}, { overflow });
        await measure(resize, view.container, 120);
        expect(getList(view.container)?.lastElementChild).toHaveClass(`${prefixCls}-overflow`);
        expect(getList(view.container)).toHaveTextContent(/^alarmbookmark\+4$/);
        expect(overflow.mock.lastCall?.[0].position).toBe('end');
    });

    it('collapse: #overflow 输出的多个节点包在一个被测量的 overflow 节点中', async () => {
        const resize = stubResizeObserver();
        const view = renderList(
            {},
            {
                overflow: ({ items: rest }: OverflowListOverflowSlotProps<OverflowListItem>) => rest.map((item) => <i>{item.key}</i>),
            }
        );
        await measure(resize, view.container, 120);
        const overflowNodes = view.container.querySelectorAll(`.${prefixCls}-overflow`);
        expect(overflowNodes).toHaveLength(1);
        expect(overflowNodes[0]).toHaveTextContent(/^cameradurationeditfolder$/);
    });

    it('collapse: items 变化后先显示所有新 item，再根据新宽度重新计算', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ onOverflow }, { overflow: plus });
        await measure(resize, view.container, 120);
        expect(onOverflow).toHaveBeenCalledTimes(1);

        await view.rerender({ items: ['one', 'two', 'three'].map((key) => ({ key })) });
        expect(itemTexts(view.container)).toEqual(['one', 'two', 'three']);
        expect(getList(view.container)).toHaveStyle({ visibility: 'visible' });

        for (const item of getItems(view.container)) {
            await resize(item, 50);
        }
        expect(itemTexts(view.container)).toEqual(['one', 'two']);
        expect(screen.getByText('+1')).toBeInTheDocument();
        expect(onOverflow).toHaveBeenCalledTimes(2);
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(['three']);
    });

    it('collapse: items 增加新项而旧项沿用 key 时，只有新项上报宽度也能完成计算', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ items: items.slice(0, 2), onOverflow }, { overflow: plus });
        await measure(resize, view.container, 120);
        expect(getItems(view.container)).toHaveLength(2);

        await view.rerender({ items: items.slice(0, 3) });
        // alarm and bookmark keep their boxes, which are not observed again
        await resize(getItems(view.container)[2], 50);
        expect(itemTexts(view.container)).toEqual(['alarm', 'bookmark']);
        expect(screen.getByText('+1')).toBeInTheDocument();
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.key)).toEqual(['camera']);
    });

    it('collapse: 测量后把 collapseFrom 从 end 改为 start，按已有宽度从另一端重新计算', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ items: keys.map((name) => ({ name })), onOverflow }, { item: ({ item, index }: OverflowListItemSlotProps<OverflowListItem>) => <span>{`${index}:${item.name}`}</span>, overflow: plus });
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(['0:alarm', '1:bookmark']);

        await view.rerender({ collapseFrom: 'start' });
        expect(itemTexts(view.container)).toEqual(['4:edit', '5:folder']);
        expect(onOverflow.mock.lastCall?.[0].map((item) => item.name)).toEqual(keys.slice(0, 4));
    });

    it('scroll: 保留 #item 中元素自己的模板 ref', () => {
        const onItemRef = vi.fn<(key: string, element: Element | ComponentPublicInstance | null) => void>();
        render(ScrollRefs, { props: { onItemRef } });
        const lastRef = (key: string) => onItemRef.mock.calls.filter(([k]) => k === key).at(-1)?.[1];
        expect(lastRef('alarm')).toBe(screen.getByText('alarm'));
        expect(lastRef('bookmark')).toBe(screen.getByText('bookmark'));
        expect(screen.getByText('alarm')).toHaveAttribute('data-scrollkey', 'alarm');
    });

    it.each(['collapse', 'scroll'] as const)('%s: 没有 items 时渲染空列表', (renderMode) => {
        const view = render(OverflowList, { props: { renderMode } });
        expect(getList(view.container)).toBeInTheDocument();
        expect(getItems(view.container)).toHaveLength(0);
    });

    it('collapse: 深度相等的 items 数组或 style 不会重置，style 变化时立即重新计算', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ onOverflow }, { overflow: plus }, { style: { color: 'red' } });
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(['alarm', 'bookmark']);

        await view.rerender({ items: keys.map((key) => ({ key })), style: { color: 'red' } });
        expect(itemTexts(view.container)).toEqual(['alarm', 'bookmark']);

        await view.rerender({ items, style: { color: 'blue' } });
        await nextTick();
        expect(itemTexts(view.container)).toEqual(['alarm', 'bookmark']);
        expect(getList(view.container)).toHaveStyle({ color: 'rgb(0, 0, 255)', visibility: 'visible' });
        expect(onOverflow).toHaveBeenCalledTimes(1);
    });

    it('scroll: items 渲染在 wrapper 中，两个 overflow 节点位于其两侧', () => {
        const overflow = vi.fn<OverflowSlot>(sides);
        const view = renderList({ renderMode: 'scroll', wrapperClassName: 'wrapper', wrapperStyle: { gap: '4px' } }, { item: keyDiv, overflow }, { class: 'custom', style: { color: 'red' } });
        const list = getList(view.container) as HTMLElement;
        expect(list).toHaveClass('custom');
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(list.style.visibility).toBe('');
        const wrapper = view.container.querySelector(`.${prefixCls}-scroll-wrapper`) as HTMLElement;
        expect(wrapper).toHaveClass('wrapper');
        expect(wrapper).toHaveStyle({ gap: '4px' });
        expect([...wrapper.children].map((child) => (child as HTMLElement).dataset.scrollkey)).toEqual(keys);
        expect([...list.children].map((child) => child.textContent)).toEqual(['overflow-0:0', keys.join(''), 'overflow-1:0']);
        expect(overflow.mock.calls.map(([args]) => [args.position, args.items])).toEqual([
            ['start', []],
            ['end', []],
        ]);
    });

    it.each<[NonNullable<OverflowListProps<OverflowListItem>['overflowRenderDirection']>, string[]]>([
        ['start', ['overflow-0', 'overflow-1', 'wrapper']],
        ['end', ['wrapper', 'overflow-0', 'overflow-1']],
    ])('scroll: overflowRenderDirection 为 %s 时，两个 overflow 节点都放在该侧', (direction, order) => {
        const view = renderList(
            { overflowRenderDirection: direction, renderMode: 'scroll' },
            {
                item: keyDiv,
                overflow: ({ position }: OverflowListOverflowSlotProps<OverflowListItem>) => <span>{`overflow-${position === 'start' ? 0 : 1}`}</span>,
            }
        );
        expect([...(getList(view.container)?.children ?? [])].map((child) => (child.classList.contains(`${prefixCls}-scroll-wrapper`) ? 'wrapper' : child.textContent))).toEqual(order);
    });

    it('scroll: 上报各侧的相交状态与 overflow，visibleStateChange 在 DOM 更新后发出', async () => {
        const io = stubIntersectionObserver();
        const onIntersect = vi.fn<(res: Record<string, IntersectionObserverEntry>) => void>();
        const endSideOnChange: (string | null | undefined)[] = [];
        const onVisibleStateChange = vi.fn<(state: Map<string, boolean>) => void>(() => endSideOnChange.push(screen.queryByText(/^overflow-1:/)?.textContent));
        const overflow = vi.fn<OverflowSlot>(sides);
        renderList({ renderMode: 'scroll', threshold: 0.5, onIntersect, onVisibleStateChange }, { item: keyDiv, overflow });
        expect(io.live()).toHaveLength(1);
        expect(io.live()[0].options).toMatchObject({ threshold: 0.5 });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(keys);

        await io.intersect({ bookmark: true, camera: true, duration: true });
        expect(onIntersect).toHaveBeenCalledTimes(1);
        const res = onIntersect.mock.lastCall?.[0] ?? {};
        expect(Object.keys(res)).toEqual(keys);
        expect(res.alarm.isIntersecting).toBe(false);
        expect(res.camera.target).toBe(screen.getByText('camera'));
        expect(onVisibleStateChange).toHaveBeenCalledTimes(1);
        expect([...(onVisibleStateChange.mock.lastCall?.[0] ?? [])]).toEqual(keys.map((key) => [key, key !== 'alarm' && key !== 'edit' && key !== 'folder']));
        expect(endSideOnChange).toEqual(['overflow-1:2']);
        expect(screen.getByText('overflow-0:1')).toBeInTheDocument();
        expect(screen.getByText('overflow-1:2')).toBeInTheDocument();
        const lastSides = overflow.mock.calls.slice(-2).map(([args]) => args.items.map((item) => item.key));
        expect(lastSides).toEqual([['alarm'], ['edit', 'folder']]);

        await io.intersect({});
        expect(screen.getByText('overflow-0:1')).toBeInTheDocument();
        expect(screen.getByText('overflow-1:2')).toBeInTheDocument();
    });

    it('scroll: items 变化后观察新节点，卸载时停止观察', async () => {
        const io = stubIntersectionObserver();
        const view = renderList({ renderMode: 'scroll' }, { item: keyDiv, overflow: sides });
        await io.intersect({ alarm: true, bookmark: true });
        expect(screen.getByText('overflow-1:4')).toBeInTheDocument();

        await view.rerender({ items: keys.map((key) => ({ key })) });
        expect(io.live()).toHaveLength(1);
        expect(screen.getByText('overflow-1:4')).toBeInTheDocument();

        const next = ['alarm', 'one', 'two'];
        await view.rerender({ items: next.map((key) => ({ key })) });
        expect(io.live()).toHaveLength(1);
        expect(io.observed()).toEqual(next.map((key) => screen.getByText(key)));
        expect(screen.getByText('overflow-0:0')).toBeInTheDocument();
        expect(screen.getByText('overflow-1:0')).toBeInTheDocument();

        await io.intersect({ alarm: true });
        expect(screen.getByText('overflow-1:2')).toBeInTheDocument();

        view.unmount();
        expect(io.observed()).toEqual([]);
    });

    it('scroll: 与列表无关的重新渲染不重建 observer，也不重复观察', async () => {
        const io = stubIntersectionObserver();
        const onIntersect = vi.fn<(res: Record<string, IntersectionObserverEntry>) => void>();
        const view = renderList({ renderMode: 'scroll', onIntersect }, { item: keyDiv });
        await view.rerender({ wrapperClassName: 'changed' });
        expect(view.container.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveClass('changed');
        expect(io.observers).toHaveLength(1);
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(keys);
        await io.intersect({ alarm: true });
        expect(onIntersect).toHaveBeenCalledTimes(1);
    });

    it('renderMode 在 collapse 与 scroll 之间切换', async () => {
        const io = stubIntersectionObserver();
        const view = renderList({ renderMode: 'scroll' }, { item: keyDiv });
        expect(io.observed()).toHaveLength(6);

        await view.rerender({ renderMode: 'collapse' });
        expect(io.observed()).toEqual([]);
        expect(itemTexts(view.container)).toEqual(keys);
        expect(view.container.querySelector(`.${prefixCls}-scroll-wrapper`)).toBeNull();

        await view.rerender({ renderMode: 'scroll' });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(keys);
        expect(getItems(view.container)).toEqual([]);
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { OverflowList: { renderMode: 'scroll' } };
        const view = renderList({}, { item: keyDiv });
        expect(view.container.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveTextContent(keys.join(''));
    });

    it.each(['collapse', 'scroll'] as const)('%s: 未声明的属性透传到根元素，ref 的 $el 是根元素，被命名时根为 group', (renderMode) => {
        const view = renderList({ renderMode }, { item: keyDiv }, { 'data-testid': 'list', 'aria-label': 'tags' });
        const list = getList(view.container);
        expect(list).toBe(screen.getByTestId('list'));
        expect(list).toBe(view.container.firstElementChild);
        // read as attributes: a collapse list stays visibility: hidden until measured, which this test never does
        expect(list).toHaveAttribute('role', 'group');
        expect(list).toHaveAttribute('aria-label', 'tags');
    });

    it('使用方传入的 role 优先于 group', () => {
        const view = renderList({}, {}, { 'aria-label': 'tags', role: 'list' });
        expect(getList(view.container)).toHaveAttribute('role', 'list');
    });

    it('collapse: 不提供 #item 时 items 不渲染任何内容', () => {
        const view = render(OverflowList, { props: { items } });
        expect(getItems(view.container)).toHaveLength(6);
        expect(getList(view.container)).toHaveTextContent(/^$/);
    });

    it('collapse: items 为空数组时不渲染任何项也不报错', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ items: [], onOverflow }, { overflow: plus });
        await resize(getList(view.container), 200);
        expect(getItems(view.container)).toHaveLength(0);
        expect(getList(view.container)).toHaveStyle({ visibility: 'visible' });
        expect(onOverflow).not.toHaveBeenCalled();
    });

    it('scroll: items 为空数组时不渲染任何项也不报错', () => {
        stubIntersectionObserver();
        const view = renderList({ items: [], renderMode: 'scroll' }, { item: keyDiv });
        expect(getList(view.container)).toBeInTheDocument();
        expect(view.container.querySelectorAll('[data-scrollkey]')).toHaveLength(0);
    });

    it('scroll: 数字 key 也能按相交状态拆分两侧 overflow', async () => {
        const io = stubIntersectionObserver();
        const overflow = vi.fn<OverflowSlot>(() => null);
        renderList({ items: [{ key: 1 }, { key: 2 }, { key: 3 }], renderMode: 'scroll' }, { item: keyDiv, overflow });
        await io.intersect({ 2: true });
        expect(overflow.mock.calls.slice(-2).map(([args]) => args.items.map((item) => item.key))).toEqual([[1], [3]]);
    });

    it('scroll: itemKey 指向其他字段时按该字段拆分两侧 overflow', async () => {
        const io = stubIntersectionObserver();
        const overflow = vi.fn<OverflowSlot>(() => null);
        renderList({ itemKey: 'id', items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], renderMode: 'scroll' }, { item: ({ item }: OverflowListItemSlotProps<OverflowListItem>) => <div>{item.id}</div>, overflow });
        await io.intersect({ b: true });
        expect(overflow.mock.calls.slice(-2).map(([args]) => args.items.map((item) => item.id))).toEqual([['a'], ['c']]);
    });

    it('scroll: #item 对某项没有输出元素时跳过该项而不报错', () => {
        const view = renderList(
            { renderMode: 'scroll' },
            {
                item: ({ item }: OverflowListItemSlotProps<OverflowListItem>) => (item.key === 'camera' ? null : <div>{item.key}</div>),
            }
        );
        expect(view.container.querySelector(`.${prefixCls}-scroll-wrapper`)).toHaveTextContent(keys.filter((key) => key !== 'camera').join(''));
    });

    it('scroll: threshold 变化后用新值重建 observer', async () => {
        const io = stubIntersectionObserver();
        const view = renderList({ renderMode: 'scroll', threshold: 0.5 }, { item: keyDiv });
        await view.rerender({ threshold: 1 });
        expect(io.live()).toHaveLength(1);
        expect(io.live()[0].options).toMatchObject({ threshold: 1 });
        expect(io.observed()).toHaveLength(6);
    });

    it('collapse: #overflow 输出为空时不渲染 overflow 节点', async () => {
        const resize = stubResizeObserver();
        const view = renderList({}, { overflow: () => null });
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(['alarm', 'bookmark']);
        expect(view.container.querySelector(`.${prefixCls}-overflow`)).toBeNull();
    });

    it('collapse: #overflow 只输出文本时同样包装并计入宽度', async () => {
        const resize = stubResizeObserver();
        const onOverflow = vi.fn<OverflowHandler>();
        const view = renderList({ onOverflow }, { overflow: ({ items: rest }: OverflowListOverflowSlotProps<OverflowListItem>) => `more ${rest.length}` });
        await measure(resize, view.container, 120);
        const overflowNode = view.container.querySelector(`.${prefixCls}-overflow`);
        expect(overflowNode).toHaveTextContent(/^more 4$/);
        await resize(overflowNode, 30);
        expect(itemTexts(view.container)).toEqual(['alarm']);
        expect(onOverflow).toHaveBeenCalledTimes(2);
    });

    it('collapse: #item 的 index 是该项在 items 中的位置，collapseFrom 为 start 时同样如此', async () => {
        const resize = stubResizeObserver();
        const view = renderList(
            { collapseFrom: 'start', items: keys.map((name) => ({ name })) },
            {
                item: ({ item, index }: OverflowListItemSlotProps<OverflowListItem>) => <span>{`${index}:${item.name}`}</span>,
            }
        );
        expect(itemTexts(view.container)).toEqual(['5:folder', '4:edit', '3:duration', '2:camera', '1:bookmark', '0:alarm']);
        await resize(getList(view.container), 120);
        const widths: Record<string, number> = { folder: 70, edit: 40 };
        for (const item of getItems(view.container)) {
            await resize(item, widths[(item.textContent ?? '').split(':')[1]] ?? 20);
        }
        expect(itemTexts(view.container)).toEqual(['4:edit', '5:folder']);
    });

    it.each(['end', 'start'] as const)('collapse: 同一个对象在 items 中出现两次时，collapseFrom 为 %s，#item 收到各自的位置', async (collapseFrom) => {
        const resize = stubResizeObserver();
        const shared = { name: 'x' };
        const view = renderList(
            { collapseFrom, items: [shared, { name: 'y' }, shared] },
            {
                item: ({ item, index }: OverflowListItemSlotProps<OverflowListItem>) => <span>{`${index}:${item.name}`}</span>,
            }
        );
        expect(itemTexts(view.container)).toEqual(collapseFrom === 'end' ? ['0:x', '1:y', '2:x'] : ['2:x', '1:y', '0:x']);
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(collapseFrom === 'end' ? ['0:x', '1:y'] : ['1:y', '2:x']);
    });

    it('只改 itemKey 时丢弃按旧 key 记下的宽度，按新 key 重新测量', async () => {
        const resize = stubResizeObserver();
        const rows = keys.map((key, index) => ({ key, id: `id-${index}` }));
        const view = renderList({ items: rows }, { overflow: plus });
        await measure(resize, view.container, 300);
        expect(itemTexts(view.container)).toEqual(keys);

        await view.rerender({ itemKey: 'id' });
        for (const item of getItems(view.container)) {
            await resize(item, 30);
        }
        await resize(getList(view.container), 120);
        expect(itemTexts(view.container)).toEqual(keys.slice(0, 4));
    });

    it('有项溢出时只改 itemKey，全部项按新 key 重新测量，之后容器变宽能展开全部', async () => {
        const resize = stubResizeObserver();
        const rows = keys.map((key, index) => ({ key, id: `id-${index}` }));
        const view = renderList({ items: rows }, { overflow: plus });
        await measure(resize, view.container, 120);
        expect(itemTexts(view.container)).toEqual(keys.slice(0, 2));

        await view.rerender({ itemKey: 'id' });
        expect(itemTexts(view.container)).toEqual(keys);
        for (const item of getItems(view.container)) {
            await resize(item, 50);
        }
        expect(itemTexts(view.container)).toEqual(keys.slice(0, 2));
        await resize(getList(view.container), 400);
        expect(itemTexts(view.container)).toEqual(keys);
    });

    it('容器多次 resize 后测量收敛，不再继续渲染', async () => {
        const resize = stubResizeObserver();
        const item = vi.fn<ItemSlot>(keyItem);
        const view = renderList({}, { item, overflow: plus });
        await measure(resize, view.container, 300);
        for (const width of [120, 200, 90, 400, 150]) {
            await resize(getList(view.container), width);
        }
        const calls = item.mock.calls.length;
        await sleep(50);
        expect(item).toHaveBeenCalledTimes(calls);
        expect(itemTexts(view.container)).toEqual(keys.slice(0, 3));
    });

    it('全局默认的 itemKey 函数生效；props 运行时 Boolean 有 default 键、函数 prop 默认值为 undefined', async () => {
        const io = stubIntersectionObserver();
        semiGlobal.config.overrideDefaultProps = { OverflowList: { itemKey: (item) => (item as { id: string }).id } };
        const overflow = vi.fn<OverflowSlot>(() => null);
        renderList({ items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], renderMode: 'scroll' }, { item: ({ item }: OverflowListItemSlotProps<OverflowListItem>) => <div>{item.id}</div>, overflow });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(['a', 'b', 'c']);
        await io.intersect({ a: true });
        expect(overflow.mock.calls.slice(-1)[0][0].items.map((item) => item.id)).toEqual(['b', 'c']);

        const declared = (OverflowList as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
        const missingDefault = Object.entries(declared)
            .filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))
            .map(([key]) => key);
        expect(missingDefault).toEqual([]);
        expect('default' in declared.itemKey).toBe(true);
        expect(declared.itemKey.default).toBeUndefined();
    });

    it('scroll: wrapperProps 落在 wrapper 上', () => {
        const view = renderList({ renderMode: 'scroll', wrapperProps: { role: 'tablist', 'aria-orientation': 'horizontal' } }, { item: keyDiv });
        expect(screen.getByRole('tablist')).toBe(view.container.querySelector(`.${prefixCls}-scroll-wrapper`));
    });
});
