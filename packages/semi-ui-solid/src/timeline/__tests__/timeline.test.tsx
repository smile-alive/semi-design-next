import { createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Timeline, { type Data, type TimelineProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefixCls = `${BASE_CLASS_PREFIX}-timeline`;

const dataSource: Data[] = [
    { time: '2019-07-14 10:35', extra: '节点辅助说明信息', content: '第一个节点内容', type: 'ongoing' },
    { time: '2019-06-13 16:17', extra: '节点辅助说明信息', content: '第二个节点内容', color: 'pink' },
    { time: '2019-05-14 18:34', extra: '节点辅助说明信息', content: '第三个节点内容', type: 'warning' },
    { time: '2019-05-09 09:12', extra: '节点辅助说明信息', content: '第四个节点内容', type: 'success' },
];

function renderTl(props: Partial<TimelineProps> = {}) {
    return render(() => <Timeline dataSource={dataSource} {...props} />);
}

const getItems = (container: HTMLElement) => container.querySelectorAll(`.${prefixCls}-item`);
const sideOf = (item: Element) => ['left', 'right'].filter((side) => item.classList.contains(`${prefixCls}-item-${side}`)).join();

describe('Timeline', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Timeline 的 dataSource', () => {
        const { container } = renderTl();
        expect(getItems(container)).toHaveLength(4);
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`) as HTMLElement;
        expect(firstItem.textContent).toEqual('第一个节点内容节点辅助说明信息2019-07-14 10:35');
        expect(firstItem.querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^节点辅助说明信息$/);
        expect(firstItem.querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^2019-07-14 10:35$/);
        expect(getItems(container)[0].querySelector(`.${prefixCls}-item-head-ongoing`)).not.toBeNull();
    });

    it('Timeline 的 JSX 子节点', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item time="2019-07-14 10:35">第一个节点内容</Timeline.Item>
                <Timeline.Item time="2019-06-13 16:17">第二个节点内容</Timeline.Item>
                <Timeline.Item time="2019-05-14 18:34">第三个节点内容</Timeline.Item>
            </Timeline>
        ));
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`) as HTMLElement;
        expect(firstItem.textContent).toEqual('第一个节点内容2019-07-14 10:35');
    });

    it('Timeline.Item 的 type', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item type="default">1</Timeline.Item>
                <Timeline.Item type="ongoing">2</Timeline.Item>
                <Timeline.Item type="success">3</Timeline.Item>
                <Timeline.Item type="warning">4</Timeline.Item>
                <Timeline.Item type="error">5</Timeline.Item>
            </Timeline>
        ));
        const items = getItems(container);
        expect(items).toHaveLength(5);
        ['default', 'ongoing', 'success', 'warning', 'error'].forEach((type, index) => {
            expect(items[index].querySelector(`.${prefixCls}-item-head-${type}`)).not.toBeNull();
        });
    });

    it('Timeline 的 class 和 style', () => {
        const { container } = render(() => (
            <Timeline class="test" style={{ color: 'red' }}>
                <Timeline.Item>1</Timeline.Item>
            </Timeline>
        ));
        const timeline = container.querySelector(`.${prefixCls}.test`);
        expect(timeline).not.toBeNull();
        expect(timeline).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Timeline.Item 的 class 和 style', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item class="test" style={{ color: 'red' }}>
                    1
                </Timeline.Item>
                <Timeline.Item>2</Timeline.Item>
            </Timeline>
        ));
        const items = getItems(container);
        expect(items[0]).toHaveClass('test');
        expect(items[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(items[1]).not.toHaveClass('test');
    });

    it('默认节点、自定义 dot 与自定义颜色', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item time="2019-07-14 10:35">默认样式的节点</Timeline.Item>
                <Timeline.Item type="warning" dot="a">
                    自定义图标
                </Timeline.Item>
                <Timeline.Item color="pink">自定义节点颜色</Timeline.Item>
            </Timeline>
        ));
        const items = getItems(container);
        expect(items[0].querySelector(`.${prefixCls}-item-head-default`)).not.toBeNull();
        expect(items[1].querySelector(`.${prefixCls}-item-head`)).toHaveTextContent(/^a$/);
        expect(items[2].querySelector(`.${prefixCls}-item-head-default`)).toHaveStyle({ backgroundColor: 'rgb(255, 192, 203)' });
    });

    it('Timeline 的 mode', () => {
        for (const mode of ['left', 'center', 'alternate', 'right'] as const) {
            const { container, unmount } = renderTl({ mode });
            expect(container.querySelectorAll(`.${prefixCls}-${mode}`)).toHaveLength(1);
            unmount();
        }
    });

    it('time 可以是节点', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item time={<span>2019-07-14 10:35</span>}>第一个节点内容</Timeline.Item>
                <Timeline.Item time="2019-06-13 16:17">第二个节点内容</Timeline.Item>
            </Timeline>
        ));
        const time = container.querySelector(`.${prefixCls}-item-content-time`) as HTMLElement;
        expect(time.innerHTML).toEqual('<span>2019-07-14 10:35</span>');
    });

    it('默认 left 模式，所有项目都放在左侧', () => {
        const { container } = renderTl();
        expect(container.querySelector('ul')).toHaveClass(prefixCls, `${prefixCls}-left`);
        getItems(container).forEach((item) => expect(item).toHaveClass(`${prefixCls}-item-left`));
    });

    it('按 mode 和 position 放置项目', () => {
        const positions = (mode: TimelineProps['mode']) => {
            const { container, unmount } = render(() => (
                <Timeline mode={mode}>
                    <Timeline.Item>a</Timeline.Item>
                    <Timeline.Item>b</Timeline.Item>
                    <Timeline.Item position="left">c</Timeline.Item>
                    <Timeline.Item position="right">d</Timeline.Item>
                </Timeline>
            ));
            const result = [...getItems(container)].map(sideOf);
            unmount();
            return result;
        };
        expect(positions('left')).toEqual(['left', 'left', 'left', 'left']);
        expect(positions('right')).toEqual(['right', 'right', 'right', 'right']);
        expect(positions('center')).toEqual(['left', 'left', 'left', 'right']);
        expect(positions('alternate')).toEqual(['left', 'right', 'left', 'right']);
    });

    it('alternate 只按实际渲染的项交替，条件为假的子节点不占位', () => {
        const { container } = render(() => (
            <Timeline mode="alternate">
                <Timeline.Item>a</Timeline.Item>
                {false}
                <Timeline.Item>b</Timeline.Item>
                {null}
                <Timeline.Item>c</Timeline.Item>
            </Timeline>
        ));
        expect([...getItems(container)].map(sideOf)).toEqual(['left', 'right', 'left']);
    });

    it('alternate 按展开数组后的位置交替，增删项后重新计算', () => {
        const [extra, setExtra] = createSignal(true);
        const { container } = render(() => (
            <Timeline mode="alternate">
                <Timeline.Item>a</Timeline.Item>
                {extra() ? [<Timeline.Item>b</Timeline.Item>, <Timeline.Item>c</Timeline.Item>] : null}
                <Timeline.Item>d</Timeline.Item>
            </Timeline>
        ));
        expect([...getItems(container)].map(sideOf)).toEqual(['left', 'right', 'left', 'right']);
        setExtra(false);
        expect([...getItems(container)].map(sideOf)).toEqual(['left', 'right']);
    });

    it('dataSource 的类型不接受 children', () => {
        expectTypeOf<Data>().not.toHaveProperty('children');
    });

    it('项目的 class 与位置类名并存，dataSource 同样如此', () => {
        const { container } = render(() => <Timeline dataSource={[{ content: 'a', class: 'own' }, { content: 'b' }]} mode="alternate" />);
        const items = getItems(container);
        expect(items[0]).toHaveClass('own', `${prefixCls}-item-left`);
        expect(items[1]).toHaveClass(`${prefixCls}-item-right`);
    });

    it('dataSource 为空时渲染 children，非 Timeline.Item 的子节点不渲染并告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <Timeline dataSource={[]}>
                text
                {null}
                <Timeline.Item>a</Timeline.Item>
            </Timeline>
        ));
        const list = container.querySelector('ul') as HTMLElement;
        expect(getItems(container)).toHaveLength(1);
        expect(list.children).toHaveLength(1);
        expect(list.textContent).not.toContain('text');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Timeline.Item'));
    });

    it('dataSource 内容不会放到项目元素上', () => {
        const { container } = renderTl();
        getItems(container).forEach((item) => expect(item).not.toHaveAttribute('content'));
    });

    it('dataSource 变化时更新项目', () => {
        const [data, setData] = createSignal<Data[]>([{ content: 'a' }]);
        const { container } = render(() => <Timeline dataSource={data()} />);
        expect(getItems(container)).toHaveLength(1);
        setData([{ content: 'a2', time: 't' }, { content: 'b' }]);
        expect(getItems(container)).toHaveLength(2);
        expect(getItems(container)[0]).toHaveTextContent('a2t');
    });

    it('只在传入时渲染 extra 和 time', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item>a</Timeline.Item>
            </Timeline>
        ));
        expect(container.querySelector(`.${prefixCls}-item-content-extra`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content`)?.textContent).toBe('a');
    });

    it('自定义 dot 时标记为装饰，并对辅助技术隐藏 head 和 tail', () => {
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item dot={<span>x</span>}>a</Timeline.Item>
                <Timeline.Item>b</Timeline.Item>
            </Timeline>
        ));
        const heads = container.querySelectorAll(`.${prefixCls}-item-head`);
        expect(heads[0]).toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[1]).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[0]).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector(`.${prefixCls}-item-tail`)).toHaveAttribute('aria-hidden', 'true');
        expect(heads[1]).not.toHaveAttribute('style');
    });

    it('项目的 props 变化时更新', () => {
        const [type, setType] = createSignal<'success' | 'error'>('success');
        const [time, setTime] = createSignal('t1');
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item type={type()} time={time()}>
                    a
                </Timeline.Item>
            </Timeline>
        ));
        expect(container.querySelector(`.${prefixCls}-item-head-success`)).not.toBeNull();
        setType('error');
        setTime('t2');
        expect(container.querySelector(`.${prefixCls}-item-head-error`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent('t2');
    });

    it('点击时以点击事件调用项目的 onClick', () => {
        // currentTarget is cleared once dispatch ends, so read it inside the handler
        const onClick = vi.fn<(e: MouseEvent) => EventTarget | null>((e) => e.currentTarget);
        const { container } = render(() => (
            <Timeline>
                <Timeline.Item onClick={onClick}>a</Timeline.Item>
                <Timeline.Item>b</Timeline.Item>
            </Timeline>
        ));
        fireEvent.click(getItems(container)[1]);
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.click(getItems(container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onClick.mock.results[0].value).toBe(getItems(container)[0]);
    });

    it('可点击项目支持 Enter 和 Space 操作，普通项目不可聚焦', async () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        render(() => (
            <Timeline>
                <Timeline.Item onClick={onClick}>a</Timeline.Item>
                <Timeline.Item>b</Timeline.Item>
            </Timeline>
        ));
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(1);
        buttons[0].focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('可点击项目的 extra 在按钮之外，点击其中的控件不触发项目的 onClick', async () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const onExtra = vi.fn<(e: MouseEvent) => void>();
        render(() => (
            <Timeline>
                <Timeline.Item extra={<button onClick={onExtra}>more</button>} onClick={onClick}>
                    a
                </Timeline.Item>
            </Timeline>
        ));
        const main = screen.getByRole('button', { name: 'a' });
        expect(main).not.toContainElement(screen.getByText('more'));
        await userEvent.click(screen.getByText('more'));
        expect(onExtra).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(main);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('extra 内 Portal 弹层的点击不触发项目的 onClick', async () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        render(() => (
            <Timeline>
                <Timeline.Item
                    extra={
                        <Portal>
                            <button type="button">InPortal</button>
                        </Portal>
                    }
                    onClick={onClick}
                >
                    a
                </Timeline.Item>
            </Timeline>
        ));
        await userEvent.click(screen.getByText('InPortal'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('嵌套在外层 extra 里的可点击项目仍触发自己的 onClick，外层不触发', async () => {
        const outer = vi.fn<(e: MouseEvent) => void>();
        const inner = vi.fn<(e: MouseEvent) => void>();
        render(() => (
            <Timeline>
                <Timeline.Item
                    extra={
                        <Timeline>
                            <Timeline.Item onClick={inner}>nested</Timeline.Item>
                        </Timeline>
                    }
                    onClick={outer}
                >
                    a
                </Timeline.Item>
            </Timeline>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'nested' }));
        expect(inner).toHaveBeenCalledTimes(1);
        expect(outer).not.toHaveBeenCalled();
    });

    it('aria-label 和 data-* 透传到列表，data-* 透传到项目', () => {
        const { container } = render(() => (
            <Timeline data-testid="tl" aria-label="history">
                <Timeline.Item data-id="1">a</Timeline.Item>
            </Timeline>
        ));
        const list = screen.getByTestId('tl');
        expect(list.tagName).toBe('UL');
        expect(list).toHaveAttribute('aria-label', 'history');
        expect(getItems(container)[0]).toHaveAttribute('data-id', '1');
        expect(getItems(container)[0].tagName).toBe('LI');
    });

    it('Timeline 读取 semiGlobal overrideDefaultProps 的默认值，Timeline.Item 不读取', () => {
        // TimelineItem is deliberately not a known key: Timeline.Item must ignore it
        semiGlobal.config.overrideDefaultProps = { Timeline: { mode: 'right' }, TimelineItem: { type: 'error' } } as typeof semiGlobal.config.overrideDefaultProps;
        const { container } = renderTl();
        expect(container.querySelector('ul')).toHaveClass(`${prefixCls}-right`);
        expect(getItems(container)[3].querySelector(`.${prefixCls}-item-head-success`)).not.toBeNull();
    });

    it('ref 绑定到列表，项目的 ref 绑定到其 li', () => {
        let list: HTMLUListElement | undefined;
        let item: HTMLLIElement | undefined;
        const { container } = render(() => (
            <Timeline ref={(node) => (list = node)}>
                <Timeline.Item ref={(node) => (item = node)}>a</Timeline.Item>
            </Timeline>
        ));
        expect(list).toBe(container.querySelector('ul'));
        expect(item).toBe(getItems(container)[0]);
    });

    it('其他未声明属性透传到根元素，position 不落到 li', () => {
        const onMouseEnter = vi.fn<(e: MouseEvent) => void>();
        const { container } = render(() => (
            <Timeline id="tl" title="history">
                <Timeline.Item id="first" position="right" onMouseEnter={onMouseEnter}>
                    a
                </Timeline.Item>
            </Timeline>
        ));
        const list = container.querySelector('ul');
        expect(list).toHaveAttribute('id', 'tl');
        expect(list).toHaveAttribute('title', 'history');
        expect(getItems(container)[0]).toHaveAttribute('id', 'first');
        expect(getItems(container)[0]).not.toHaveAttribute('position');
        fireEvent.mouseEnter(getItems(container)[0]);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('alternate 的 dataSource 与项目颜色', () => {
        const { container } = renderTl({ mode: 'alternate' });
        const items = getItems(container);
        expect(items).toHaveLength(4);
        expect(items[1]).toHaveClass(`${prefixCls}-item-right`);
        expect(items[1].querySelector(`.${prefixCls}-item-head`)).toHaveStyle({ backgroundColor: 'rgb(255, 192, 203)' });
    });

    it('dataSource 的节点来自渲染函数，dot 只在 renderDot 返回内容时自定义', () => {
        const { container } = render(() => (
            <Timeline
                dataSource={[
                    { content: 'a', time: 't0', extra: 'e0' },
                    { content: 'b', time: 't1' },
                ]}
                renderContent={(item) => <b>{item.content}</b>}
                renderDot={(_, index) => (index === 0 ? <i>!</i> : undefined)}
                renderTime={(item, index) => <u>{`${item.time}@${index}`}</u>}
                renderExtra={(item) => <s>{item.extra ?? 'none'}</s>}
            />
        ));
        const items = getItems(container);
        expect(items[0].querySelector('b')).toHaveTextContent(/^a$/);
        expect(items[0].querySelector(`.${prefixCls}-item-head`)).toHaveClass(`${prefixCls}-item-head-custom`);
        expect(items[1].querySelector(`.${prefixCls}-item-head`)).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(items[1].querySelector(`.${prefixCls}-item-content-time u`)).toHaveTextContent(/^t1@1$/);
        expect(items[1].querySelector(`.${prefixCls}-item-content-extra s`)).toHaveTextContent(/^none$/);
    });
});
