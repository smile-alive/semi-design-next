import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '../../_utils/semi-global';
import { Timeline, type TimelineData, type TimelineMode } from '../index';
import TimelineDemo from './timeline-demo.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-timeline`;

const dataSource: TimelineData[] = [
    { time: '2019-07-14 10:35', extra: '节点辅助说明信息', content: '第一个节点内容', type: 'ongoing' },
    { time: '2019-06-13 16:17', extra: '节点辅助说明信息', content: '第二个节点内容', color: 'pink' },
    { time: '2019-05-14 18:34', extra: '节点辅助说明信息', content: '第三个节点内容', type: 'warning' },
    { time: '2019-05-09 09:12', extra: '节点辅助说明信息', content: '第四个节点内容', type: 'success' },
];

const getItems = (container: Element) => container.querySelectorAll<HTMLElement>(`.${prefixCls}-item`);
const sides = (container: Element) => [...getItems(container)].map((li) => ['left', 'right'].filter((side) => li.classList.contains(`${prefixCls}-item-${side}`)).join());
const renderTl = (props: Record<string, unknown> = {}) => render(TimelineDemo, { props: { dataSource, ...props } });

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = undefined;
});

describe('Timeline', () => {
    it('dataSource', () => {
        const { container } = renderTl();
        expect(getItems(container)).toHaveLength(4);
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`) as Element;
        expect(firstItem.textContent).toEqual('第一个节点内容节点辅助说明信息2019-07-14 10:35');
        expect(firstItem.querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^节点辅助说明信息$/);
        expect(firstItem.querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^2019-07-14 10:35$/);
        expect(getItems(container)[0].querySelector(`.${prefixCls}-item-head-ongoing`)).not.toBeNull();
        expect(getItems(container)[1].querySelector(`.${prefixCls}-item-head`)).toHaveStyle({ backgroundColor: 'rgb(255, 192, 203)' });
    });

    it('type', () => {
        const types = ['default', 'ongoing', 'success', 'warning', 'error'] as const;
        const { container } = renderTl({ dataSource: types.map((type) => ({ type, content: type })) });
        const items = getItems(container);
        expect(items).toHaveLength(5);
        types.forEach((type, index) => {
            expect(items[index].querySelector(`.${prefixCls}-item-head-${type}`)).not.toBeNull();
        });
    });

    it('Timeline 的 class 和 style', () => {
        const { container } = renderTl({ class: 'test', style: 'color: red' });
        const timeline = container.querySelector(`.${prefixCls}.test`);
        expect(timeline).not.toBeNull();
        expect(timeline).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('数据项的 class、style 和其他元素属性落在 li 上', () => {
        const { container } = renderTl({ dataSource: [{ content: 'a', class: 'test', style: 'color: red', id: 'first', 'data-x': '1' }, { content: 'b' }] });
        const items = getItems(container);
        expect(items[0]).toHaveClass('test', `${prefixCls}-item-left`);
        expect(items[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(items[0]).toHaveAttribute('id', 'first');
        expect(items[0]).toHaveAttribute('data-x', '1');
        expect(items[0].tagName).toBe('LI');
        expect(items[1]).not.toHaveClass('test');
    });

    it('mode', () => {
        for (const mode of ['left', 'center', 'alternate', 'right'] as const) {
            const view = renderTl({ mode });
            expect(view.container.querySelectorAll(`.${prefixCls}-${mode}`)).toHaveLength(1);
            view.unmount();
        }
    });

    it('默认 left 模式，所有项目都放在左侧', () => {
        const { container } = renderTl();
        expect(container.querySelector('ul')).toHaveClass(prefixCls, `${prefixCls}-left`);
        getItems(container).forEach((li) => expect(li).toHaveClass(`${prefixCls}-item-left`));
    });

    it('按 mode 和 position 放置项目', () => {
        const positions = (mode: TimelineMode) => {
            const view = renderTl({ mode, dataSource: [{ content: 'a' }, { content: 'b' }, { content: 'c', position: 'left' }, { content: 'd', position: 'right' }] });
            const result = sides(view.container);
            view.unmount();
            return result;
        };
        expect(positions('left')).toEqual(['left', 'left', 'left', 'left']);
        expect(positions('right')).toEqual(['right', 'right', 'right', 'right']);
        expect(positions('center')).toEqual(['left', 'left', 'left', 'right']);
        expect(positions('alternate')).toEqual(['left', 'right', 'left', 'right']);
    });

    it('dataSource 内容不会放到 li 上', () => {
        const { container } = renderTl();
        getItems(container).forEach((li) => {
            expect(li).not.toHaveAttribute('content');
            expect(li).not.toHaveAttribute('position');
        });
    });

    it('dataSource 为空时只渲染列表', () => {
        const { container } = renderTl({ dataSource: [] });
        expect(container.querySelector('ul')?.children).toHaveLength(0);
    });

    it('只在有值时渲染 extra 和 time，0 渲染为数字，空字符串不渲染容器', () => {
        const { container } = renderTl({
            dataSource: [{ content: 'a' }, { content: 'b', time: 0, extra: 7 }, { content: 'c', time: '' }],
        });
        const items = getItems(container);
        expect(items[0].querySelector(`.${prefixCls}-item-content-extra`)).toBeNull();
        expect(items[0].querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
        expect(items[0].querySelector(`.${prefixCls}-item-content`)?.textContent).toBe('a');
        expect(items[1].querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^0$/);
        expect(items[1].querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^7$/);
        expect(items[2].querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
    });

    it('逐项设置 dot：只有设了的项按自定义圆点渲染，其余画默认圆点', () => {
        const { container } = renderTl({ snippets: ['dot'] });
        const heads = container.querySelectorAll(`.${prefixCls}-item-head`);
        expect(heads[0]).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[1]).toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[1].querySelector('.own-dot')).not.toBeNull();
        expect(heads[2]).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[2]).toHaveClass(`${prefixCls}-item-head-warning`);
    });

    it('自定义 dot 时标记为装饰，并对辅助技术隐藏 head 和 tail', () => {
        const { container } = renderTl({ snippets: ['dot'] });
        const head = container.querySelectorAll(`.${prefixCls}-item-head`)[1];
        expect(head).toHaveClass(`${prefixCls}-item-head-custom`);
        expect(head?.querySelector('.own-dot')).not.toBeNull();
        expect(head).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector(`.${prefixCls}-item-tail`)).toHaveAttribute('aria-hidden', 'true');
        const plain = renderTl();
        expect(plain.container.querySelector(`.${prefixCls}-item-head`)).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(plain.container.querySelector(`.${prefixCls}-item-head`)).not.toHaveAttribute('style');
    });

    it('content、time、extra snippet 收到 { item, index }', () => {
        const { container } = renderTl({ snippets: ['content', 'time', 'extra'] });
        const items = getItems(container);
        expect(items[1].querySelector('.rich')).toHaveTextContent('第二个节点内容');
        expect(items[0].querySelector('.rich')).toBeNull();
        expect(items[0].querySelector(`.${prefixCls}-item-content-time em`)).toHaveTextContent('2019-07-14 10:35!');
        expect(items[1].querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^2019-06-13 16:17$/);
        expect(items[3].querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^3:节点辅助说明信息$/);
    });

    it('点击时以点击事件调用数据项的 onClick', async () => {
        // currentTarget is cleared once dispatch ends, so read it inside the handler
        const onClick = vi.fn<(event: MouseEvent) => EventTarget | null>((event) => event.currentTarget);
        const { container } = renderTl({ dataSource: [{ content: 'a', onClick }, { content: 'b' }] });
        await userEvent.click(getItems(container)[1]);
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'a' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onClick.mock.results[0].value).toBe(getItems(container)[0]);
    });

    it('可点击项目支持 Enter 和 Space 操作，普通项目不可聚焦', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderTl({ dataSource: [{ content: 'a', onClick }, { content: 'b' }] });
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveAttribute('tabindex', '0');
        buttons[0].focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('没有 onClick 或 onClick 为 undefined 时项目内没有 button', () => {
        renderTl({ dataSource: [{ content: 'a' }, { content: 'b', onClick: undefined }] });
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('可点击项目的 extra 在按钮之外，点击其中的控件不触发 onClick', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderTl({ dataSource: [{ content: 'a', onClick }], snippets: ['button-extra'] });
        const main = screen.getByRole('button', { name: 'a' });
        expect(main).not.toContainElement(screen.getByText('more'));
        await userEvent.click(screen.getByText('more'));
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(main);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('aria-label 和 data-* 透传到列表', () => {
        renderTl({ 'data-testid': 'tl', 'aria-label': 'history' });
        const list = screen.getByTestId('tl');
        expect(list.tagName).toBe('UL');
        expect(list).toHaveAttribute('aria-label', 'history');
    });

    it('读取全局默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Timeline: { mode: 'right' } };
        const { container } = render(Timeline, { props: { dataSource } });
        expect(container.querySelector('ul')).toHaveClass(`${prefixCls}-right`);
        const explicit = render(Timeline, { props: { dataSource, mode: 'center' } });
        expect(explicit.container.querySelector('ul')).toHaveClass(`${prefixCls}-center`);
    });
});
