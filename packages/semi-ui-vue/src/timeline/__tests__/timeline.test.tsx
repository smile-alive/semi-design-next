/** @jsxImportSource vue */
import { type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconAlertTriangle } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Timeline, { TimelineItem, type TimelineData, type TimelineItemSlots, type TimelineMode, type TimelineProps, type TimelineSlots } from '../index';
import Conditional from './fixtures/conditional.vue';
import DataSlots from './fixtures/data-slots.vue';
import Instance from './fixtures/instance.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-timeline`;

const dataSource: TimelineData[] = [
    { time: '2019-07-14 10:35', extra: '节点辅助说明信息', content: '第一个节点内容', type: 'ongoing' },
    { time: '2019-06-13 16:17', extra: '节点辅助说明信息', content: '第二个节点内容', color: 'pink' },
    { time: '2019-05-14 18:34', extra: '节点辅助说明信息', content: '第三个节点内容', type: 'warning' },
    { time: '2019-05-09 09:12', extra: '节点辅助说明信息', content: '第四个节点内容', type: 'success' },
];

type Attrs = Record<string, unknown>;
const renderTl = (props: TimelineProps = {}, slots: TimelineSlots = {}) => render(Timeline, { props: { dataSource, ...props }, slots });
type ItemSlots = { [K in Exclude<keyof TimelineItemSlots, 'default'>]?: () => VNode[] | string };
const item = (attrs: Attrs, content: string, slots: ItemSlots = {}): VNode => <TimelineItem {...attrs}>{{ default: () => content, ...slots }}</TimelineItem>;
const renderItems = (children: () => Array<VNode | string>, props: TimelineProps = {}, attrs: Attrs = {}) => render(Timeline, { props, attrs, slots: { default: children } });
const timeSlot = (value: string) => ({ time: () => value });

const getItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`);
const sides = (container: Element) => [...getItems(container)].map((li) => ['left', 'right'].filter((side) => li.classList.contains(`${prefixCls}-item-${side}`)).join());

describe('Timeline', () => {
    it('Timeline 的 dataSource', () => {
        const { container } = renderTl();
        expect(getItems(container)).toHaveLength(4);
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`) as Element;
        expect(firstItem.textContent).toEqual('第一个节点内容节点辅助说明信息2019-07-14 10:35');
        expect(firstItem.querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^节点辅助说明信息$/);
        expect(firstItem.querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^2019-07-14 10:35$/);
        expect(getItems(container)[0].querySelector(`.${prefixCls}-item-head-ongoing`)).not.toBeNull();
        expect(getItems(container)[1].querySelector(`.${prefixCls}-item-head`)).toHaveStyle({
            backgroundColor: 'rgb(255, 192, 203)',
        });
    });

    it('Timeline 的 Item 子节点', () => {
        const { container } = renderItems(() => [item({}, '第一个节点内容', timeSlot('2019-07-14 10:35')), item({}, '第二个节点内容', timeSlot('2019-06-13 16:17')), item({}, '第三个节点内容', timeSlot('2019-05-14 18:34'))]);
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`) as Element;
        expect(firstItem.textContent).toEqual('第一个节点内容2019-07-14 10:35');
    });

    it('Timeline 的 type', () => {
        const types = ['default', 'ongoing', 'success', 'warning', 'error'] as const;
        const { container } = renderItems(() => types.map((type) => item({ type }, type)));
        const items = getItems(container);
        expect(items).toHaveLength(5);
        types.forEach((type, index) => {
            expect(items[index].querySelector(`.${prefixCls}-item-head-${type}`)).not.toBeNull();
        });
    });

    it('Timeline 的 class 和 style', () => {
        const { container } = renderItems(
            () => [item({}, 'a'), item({}, 'b')],
            {},
            {
                class: 'test',
                style: { color: 'red' },
            }
        );
        const timeline = container.querySelector(`.${prefixCls}.test`);
        expect(timeline).not.toBeNull();
        expect(timeline).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Timeline.Item 的 class 和 style', () => {
        const { container } = renderItems(() => [item({ class: 'test', style: { color: 'red' } }, 'a'), item({}, 'b')]);
        const items = getItems(container);
        expect(items[0]).toHaveClass('test');
        expect(items[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(items[1]).not.toHaveClass('test');
    });

    it('Timeline.Item 的 type、#dot 与 color', () => {
        const { container } = renderItems(() => [item({}, '默认样式的节点'), item({ type: 'warning' }, '自定义图标', { dot: () => 'a' }), item({ color: 'pink' }, '自定义节点颜色')]);
        const items = getItems(container);
        expect(items[0].querySelector(`.${prefixCls}-item-head-default`)).not.toBeNull();
        expect(items[1].querySelector(`.${prefixCls}-item-head`)).toHaveTextContent(/^a$/);
        expect(items[2].querySelector(`.${prefixCls}-item-head-default`)).toHaveStyle({
            backgroundColor: 'rgb(255, 192, 203)',
        });
    });

    it('Timeline 的 mode', () => {
        for (const mode of ['left', 'center', 'alternate', 'right'] as const) {
            const view = renderTl({ mode });
            expect(view.container.querySelectorAll(`.${prefixCls}-${mode}`)).toHaveLength(1);
            view.unmount();
        }
    });

    it('Item 的 #time 放节点', () => {
        const { container } = renderItems(() => [item({}, '第一个节点内容', { time: () => [<span>2019-07-14 10:35</span>] }), item({}, '第二个节点内容', timeSlot('2019-06-13 16:17'))]);
        const time = container.querySelector(`.${prefixCls}-item-content-time`) as Element;
        expect(time.innerHTML).toEqual('<span>2019-07-14 10:35</span>');
    });

    it('默认 left 模式，所有项目都放在左侧', () => {
        const { container } = renderTl();
        expect(container.querySelector('ul')).toHaveClass(prefixCls, `${prefixCls}-left`);
        getItems(container).forEach((li) => expect(li).toHaveClass(`${prefixCls}-item-left`));
    });

    it('按 mode 和 position 放置项目', () => {
        const positions = (mode: TimelineMode) => {
            const view = renderItems(() => [item({}, 'a'), item({}, 'b'), item({ position: 'left' }, 'c'), item({ position: 'right' }, 'd')], { mode });
            const result = sides(view.container);
            view.unmount();
            return result;
        };
        expect(positions('left')).toEqual(['left', 'left', 'left', 'left']);
        expect(positions('right')).toEqual(['right', 'right', 'right', 'right']);
        expect(positions('center')).toEqual(['left', 'left', 'left', 'right']);
        expect(positions('alternate')).toEqual(['left', 'right', 'left', 'right']);
    });

    it('项目的 class 与位置类名并存，dataSource 同样如此', () => {
        const { container } = render(Timeline, {
            props: { dataSource: [{ content: 'a', class: 'own' }, { content: 'b' }], mode: 'alternate' },
        });
        const items = getItems(container);
        expect(items[0]).toHaveClass('own', `${prefixCls}-item-left`);
        expect(items[1]).toHaveClass(`${prefixCls}-item-right`);
    });

    it('dataSource 为空时渲染默认插槽，并保留文本节点', () => {
        const { container } = render(Timeline, {
            props: { dataSource: [] },
            slots: { default: () => ['text', item({}, 'a')] },
        });
        const list = container.querySelector('ul') as Element;
        expect(getItems(container)).toHaveLength(1);
        // Vue fragments add empty anchor text nodes, so only non-empty nodes are compared
        const nodes = [...list.childNodes].filter((node) => node.nodeType !== Node.TEXT_NODE || node.nodeValue);
        expect(nodes.map((node) => node.nodeName)).toEqual(['#text', 'LI']);
        expect(nodes[0].nodeValue).toBe('text');
    });

    it('dataSource 内容不会放到项目元素上', () => {
        const { container } = renderTl();
        getItems(container).forEach((li) => {
            expect(li).not.toHaveAttribute('content');
            expect(li).not.toHaveAttribute('position');
        });
    });

    it('只在传入时渲染 extra 和 time', () => {
        const { container } = renderItems(() => [item({}, 'a')]);
        expect(container.querySelector(`.${prefixCls}-item-content-extra`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content`)?.textContent).toBe('a');
    });

    it('自定义 dot 时标记为装饰，并对辅助技术隐藏 head 和 tail', () => {
        const { container } = renderItems(() => [item({}, 'a', { dot: () => [<span>x</span>] }), item({}, 'b')]);
        const heads = container.querySelectorAll(`.${prefixCls}-item-head`);
        expect(heads[0]).toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[1]).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[0]).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector(`.${prefixCls}-item-tail`)).toHaveAttribute('aria-hidden', 'true');
        expect(heads[1]).not.toHaveAttribute('style');
    });

    it('点击时以点击事件调用项目的 click 监听', async () => {
        // currentTarget is cleared once dispatch ends, so read it inside the handler
        const onClick = vi.fn<(event: MouseEvent) => EventTarget | null>((event) => event.currentTarget);
        const { container } = renderItems(() => [item({ onClick }, 'a'), item({}, 'b')]);
        await fireEvent.click(getItems(container)[1]);
        expect(onClick).not.toHaveBeenCalled();
        await fireEvent.click(getItems(container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onClick.mock.results[0].value).toBe(getItems(container)[0]);
    });

    it('可点击项目支持 Enter 和 Space 操作，普通项目不可聚焦', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderItems(() => [item({ onClick }, 'a'), item({}, 'b')]);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(1);
        buttons[0].focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('@click.once（onClickOnce）的项目是可聚焦的 button，点两次只调用一次', async () => {
        const onClickOnce = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderItems(() => [item({ onClickOnce }, 'a'), item({}, 'b')]);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveAttribute('tabindex', '0');
        await fireEvent.click(getItems(container)[0]);
        await fireEvent.click(getItems(container)[0]);
        expect(onClickOnce).toHaveBeenCalledTimes(1);
    });

    it('可点击项目的 extra 在按钮之外，点击其中的控件不触发项目的 click 监听', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onExtra = vi.fn<(event: MouseEvent) => void>();
        renderItems(() => [item({ onClick }, 'a', { extra: () => [<button onClick={onExtra}>more</button>] })]);
        const main = screen.getByRole('button', { name: 'a' });
        expect(main).not.toContainElement(screen.getByText('more'));
        await userEvent.click(screen.getByText('more'));
        expect(onExtra).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(main);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('嵌套在外层 extra 里的可点击项目仍触发自己的 click 监听，外层不触发', async () => {
        const outer = vi.fn<(event: MouseEvent) => void>();
        const inner = vi.fn<(event: MouseEvent) => void>();
        const nested = () => <Timeline>{{ default: () => [item({ onClick: inner }, 'nested')] }}</Timeline>;
        renderItems(() => [item({ onClick: outer }, 'a', { extra: () => [nested()] })]);
        await userEvent.click(screen.getByRole('button', { name: 'nested' }));
        expect(inner).toHaveBeenCalledTimes(1);
        expect(outer).not.toHaveBeenCalled();
    });

    it('嵌套项目自己的 extra 里的控件不触发内外层的 click 监听', async () => {
        const outer = vi.fn<(event: MouseEvent) => void>();
        const inner = vi.fn<(event: MouseEvent) => void>();
        const nested = () => (
            <Timeline>
                {{
                    default: () => [item({ onClick: inner }, 'nested', { extra: () => [<button>more</button>] })],
                }}
            </Timeline>
        );
        renderItems(() => [item({ onClick: outer }, 'a', { extra: () => [nested()] })]);
        await userEvent.click(screen.getByText('more'));
        expect(inner).not.toHaveBeenCalled();
        expect(outer).not.toHaveBeenCalled();
    });

    it('aria-label 和 data-* 透传到列表，data-* 透传到项目', () => {
        const { container } = renderItems(
            () => [item({ 'data-id': '1' }, 'a')],
            {},
            {
                'data-testid': 'tl',
                'aria-label': 'history',
            }
        );
        const list = screen.getByTestId('tl');
        expect(list.tagName).toBe('UL');
        expect(list).toHaveAttribute('aria-label', 'history');
        expect(getItems(container)[0]).toHaveAttribute('data-id', '1');
        expect(getItems(container)[0].tagName).toBe('LI');
    });

    it('Timeline 读取注入的 semiGlobal overrideDefaultProps，Timeline.Item 不读取', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = {
            Timeline: { mode: 'right' },
            TimelineItem: { type: 'error' },
        } as SemiGlobal['config']['overrideDefaultProps'];
        const { container } = render(Timeline, {
            props: { dataSource },
            global: { provide: { [semiGlobalKey]: semi } },
        });
        expect(container.querySelector('ul')).toHaveClass(`${prefixCls}-right`);
        expect(getItems(container)[3].querySelector(`.${prefixCls}-item-head-success`)).not.toBeNull();
        expect(getItems(container)[1].querySelector(`.${prefixCls}-item-head-default`)).not.toBeNull();
    });

    it('组件 $el 指向列表，项目的 $el 指向其 li', () => {
        const view = render(Instance);
        const [list, li] = view.emitted<[Element, Element]>().els[0];
        expect(list).toBe(view.container.querySelector('ul'));
        expect(li).toBe(getItems(view.container)[0]);
    });

    it('其他未声明属性透传到根元素', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderItems(() => [item({ id: 'first', position: 'right', onMouseenter }, 'a')], {}, { id: 'tl', title: 'history' });
        const list = container.querySelector('ul');
        expect(list).toHaveAttribute('id', 'tl');
        expect(list).toHaveAttribute('title', 'history');
        expect(getItems(container)[0]).toHaveAttribute('id', 'first');
        expect(getItems(container)[0]).not.toHaveAttribute('position');
        await fireEvent.mouseEnter(getItems(container)[0]);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
    });
});

describe('Timeline（Vue）', () => {
    it('dataSource 的 #content、#dot、#time、#extra 收到 { item, index }', () => {
        const { container } = render(DataSlots, { props: { dataSource } });
        const items = getItems(container);
        expect(items[1].querySelector('.rich')).toHaveTextContent('第二个节点内容');
        expect(items[0].querySelector('.rich')).toBeNull();
        expect(items[2].querySelector(`.${prefixCls}-item-head-custom .own-dot`)).not.toBeNull();
        expect(items[0].querySelector(`.${prefixCls}-item-head`)).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(items[0].querySelector(`.${prefixCls}-item-content-time em`)).toHaveTextContent('2019-07-14 10:35!');
        expect(items[1].querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^2019-06-13 16:17$/);
        expect(items[3].querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^3:节点辅助说明信息$/);
    });

    it('dataSource 的 time、extra 为字符串或数字时无插槽也渲染，空值不渲染容器', () => {
        const { container } = render(Timeline, {
            props: {
                dataSource: [
                    { content: 'a', time: 0, extra: 7 },
                    { content: 'b', time: '' },
                ],
            },
        });
        const items = getItems(container);
        expect(items[0].querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^0$/);
        expect(items[0].querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^7$/);
        expect(items[1].querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
        expect(items[1].querySelector(`.${prefixCls}-item-content-extra`)).toBeNull();
    });

    it('dataSource 的 onClick 交给对应的项目', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        render(Timeline, { props: { dataSource: [{ content: 'a', onClick }, { content: 'b' }] } });
        expect(screen.getAllByRole('button')).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: 'a' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Item 的 #time 与 #extra 内容为空时不渲染容器', () => {
        const { container } = renderItems(() => [item({}, 'a', { time: () => [], extra: () => '' })]);
        expect(container.querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content-extra`)).toBeNull();
    });

    it('alternate 下 v-if 为假的 Item 不占序号，v-for 生成的 Item 继续交替', async () => {
        const view = render(Conditional, { props: { showSecond: false, extra: ['d', 'e'] } });
        expect(sides(view.container)).toEqual(['left', 'right', 'left', 'right']);
        await view.rerender({ showSecond: true, extra: ['d', 'e'] });
        expect(sides(view.container)).toEqual(['left', 'right', 'left', 'right', 'left']);
    });

    it('没有 click 监听或监听为 undefined 时项目内没有 button', () => {
        renderItems(() => [item({}, 'a'), item({ onClick: undefined }, 'b')]);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('Item 的 attrs 落在 li 上，click 监听只调用一次', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderItems(() => [item({ class: 'own', style: { color: 'red' }, 'data-x': '1', 'aria-describedby': 'd', onClick }, 'a')]);
        const li = getItems(container)[0];
        expect(li).toHaveClass('own', `${prefixCls}-item-left`);
        expect(li).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(li).toHaveAttribute('data-x', '1');
        expect(li).toHaveAttribute('aria-describedby', 'd');
        await userEvent.click(screen.getByRole('button', { name: 'a' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Timeline.Item 与具名导出 TimelineItem 是同一个对象', () => {
        expect(Timeline.Item).toBe(TimelineItem);
    });

    it('Item 脱离 Timeline 渲染时没有位置类名', () => {
        const { container } = render(TimelineItem, { slots: { default: () => 'a' } });
        expect(getItems(container)[0].className).toBe(`${prefixCls}-item`);
    });

    it('Boolean prop 都有 default 键，Function prop 的 default 为 undefined', () => {
        const offenders = [Timeline, TimelineItem].flatMap((component) =>
            Object.entries((component as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props)
                .filter(([, option]) => {
                    const types = [option.type].flat();
                    return (types.includes(Boolean) && !Object.hasOwn(option, 'default')) || (types.includes(Function) && option.default !== undefined);
                })
                .map(([name]) => name)
        );
        expect(offenders).toEqual([]);
    });

    it('图标组件可作为 #dot', () => {
        const { container } = renderItems(() => [item({}, 'a', { dot: () => [<IconAlertTriangle />] })]);
        expect(container.querySelector(`.${prefixCls}-item-head-custom .semi-icon`)).not.toBeNull();
    });
});
