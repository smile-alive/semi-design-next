import { StrictMode, createRef } from 'react';
import { createPortal } from 'react-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Timeline, Icon } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { IconProps } from '@fibrae/semi-ui-react/icons';
import type { Data, TimelineProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-timeline`;

const dataSource: Data[] = [
    {
        time: '2019-07-14 10:35',
        extra: '节点辅助说明信息',
        content: '第一个节点内容',
        type: 'ongoing',
    },
    {
        time: '2019-06-13 16:17',
        extra: '节点辅助说明信息',
        content: <span style={{ fontSize: '18px' }}>第二个节点内容</span>,
        color: 'pink',
    },
    {
        time: '2019-05-14 18:34',
        extra: '节点辅助说明信息',
        // IconProps requires svg, which this legacy type-only icon never had
        dot: <Icon {...({ type: 'alert_triangle' } as IconProps)} />,
        content: '第三个节点内容',
        type: 'warning',
    },
    {
        time: '2019-05-09 09:12',
        extra: '节点辅助说明信息',
        content: '第四个节点内容',
        type: 'success',
    },
];

function renderTl(props: Partial<TimelineProps> = {}) {
    const realProps = {
        dataSource,
        ...props,
    };
    return render(<Timeline {...realProps} />);
}

const getItems = (container: HTMLElement) => container.querySelectorAll(`.${prefixCls}-item`);

describe('Timeline', () => {
    it('Timeline 的 dataSource', () => {
        const { container } = renderTl();
        expect(getItems(container)).toHaveLength(4);
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`);
        expect(firstItem.textContent).toEqual('第一个节点内容节点辅助说明信息2019-07-14 10:35');
        expect(firstItem.querySelector(`.${prefixCls}-item-content-extra`)).toHaveTextContent(/^节点辅助说明信息$/);
        expect(firstItem.querySelector(`.${prefixCls}-item-content-time`)).toHaveTextContent(/^2019-07-14 10:35$/);
        expect(getItems(container)[0].querySelector(`.${prefixCls}-item-head-ongoing`)).not.toBeNull();
    });

    it('Timeline 的 JSX 子节点', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item time="2019-07-14 10:35">第一个节点内容</Timeline.Item>
                <Timeline.Item time="2019-06-13 16:17">第二个节点内容</Timeline.Item>
                <Timeline.Item time="2019-05-14 18:34">第三个节点内容</Timeline.Item>
            </Timeline>
        );
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content`);
        expect(firstItem.textContent).toEqual('第一个节点内容2019-07-14 10:35');
    });

    it('Timeline 的 type', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item type="default" time="2019-07-14 10:35">
                    第一个节点内容
                </Timeline.Item>
                <Timeline.Item type="ongoing" time="2019-06-13 16:17">
                    第二个节点内容
                </Timeline.Item>
                <Timeline.Item type="success" time="2019-05-14 18:34">
                    第三个节点内容
                </Timeline.Item>
                <Timeline.Item type="warning" time="2019-05-14 18:34">
                    第四个节点内容
                </Timeline.Item>
                <Timeline.Item type="error" time="2019-05-14 18:34">
                    第五个节点内容
                </Timeline.Item>
            </Timeline>
        );
        const items = getItems(container);
        expect(items).toHaveLength(5);
        ['default', 'ongoing', 'success', 'warning', 'error'].forEach((type, index) => {
            expect(items[index].querySelector(`.${prefixCls}-item-head-${type}`)).not.toBeNull();
        });
    });

    it('Timeline 的 className 和 style', () => {
        const { container } = render(
            <Timeline className="test" style={{ color: 'red' }}>
                <Timeline.Item type="default" time="2019-07-14 10:35">
                    第一个节点内容
                </Timeline.Item>
                <Timeline.Item type="ongoing" time="2019-06-13 16:17">
                    第二个节点内容
                </Timeline.Item>
                <Timeline.Item type="success" time="2019-05-14 18:34">
                    第三个节点内容
                </Timeline.Item>
            </Timeline>
        );
        const timeline = container.querySelector(`.${prefixCls}.test`);
        expect(timeline).not.toBeNull();
        expect(timeline).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Timeline.item 的 className 和 style', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item type="default" className="test" style={{ color: 'red' }} time="2019-07-14 10:35">
                    第一个节点内容
                </Timeline.Item>
                <Timeline.Item type="ongoing" time="2019-06-13 16:17">
                    第二个节点内容
                </Timeline.Item>
                <Timeline.Item type="success" time="2019-05-14 18:34">
                    第三个节点内容
                </Timeline.Item>
            </Timeline>
        );
        const items = getItems(container);
        expect(items[0]).toHaveClass('test');
        expect(items[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(items[1]).not.toHaveClass('test');
    });

    it('Timeline 的 type', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item time="2019-07-14 10:35">默认样式的节点</Timeline.Item>
                <Timeline.Item type="warning" dot="a" time="2019-06-13 16:17">
                    自定义图标
                </Timeline.Item>
                <Timeline.Item color="pink" time="2019-05-14 18:34">
                    自定义节点颜色
                </Timeline.Item>
            </Timeline>
        );
        const items = getItems(container);
        expect(items[0].querySelector(`.${prefixCls}-item-head-default`)).not.toBeNull();
        expect(items[1].querySelector(`.${prefixCls}-item-head`)).toHaveTextContent(/^a$/);
        expect(items[2].querySelector(`.${prefixCls}-item-head-default`)).toHaveStyle({
            backgroundColor: 'rgb(255, 192, 203)',
        });
    });

    it('Timeline 的 mode', () => {
        for (const mode of ['left', 'center', 'alternate', 'right'] as const) {
            const { container, unmount } = renderTl({ mode });
            expect(container.querySelectorAll(`.${prefixCls}-${mode}`)).toHaveLength(1);
            unmount();
        }
    });

    it('Timeline 的 time 为 ReactNode 类型', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item time={<span>2019-07-14 10:35</span>}>第一个节点内容</Timeline.Item>
                <Timeline.Item time="2019-06-13 16:17">第二个节点内容</Timeline.Item>
            </Timeline>
        );
        const firstItem = container.querySelector(`.${prefixCls}-item .${prefixCls}-item-content .${prefixCls}-item-content-time`);
        expect(firstItem.innerHTML).toEqual('<span>2019-07-14 10:35</span>');
    });

    it('默认 left 模式，所有项目都放在左侧', () => {
        const { container } = renderTl();
        expect(container.querySelector('ul')).toHaveClass(prefixCls, `${prefixCls}-left`);
        getItems(container).forEach((item) => expect(item).toHaveClass(`${prefixCls}-item-left`));
    });

    it('按 mode 和 position 放置项目', () => {
        const positions = (mode) => {
            const { container, unmount } = render(
                <Timeline mode={mode}>
                    <Timeline.Item>a</Timeline.Item>
                    <Timeline.Item>b</Timeline.Item>
                    <Timeline.Item position="left">c</Timeline.Item>
                    <Timeline.Item position="right">d</Timeline.Item>
                </Timeline>
            );
            const result = [...getItems(container)].map((item) => ['left', 'right'].filter((side) => item.classList.contains(`${prefixCls}-item-${side}`)).join());
            unmount();
            return result;
        };
        expect(positions('left')).toEqual(['left', 'left', 'left', 'left']);
        expect(positions('right')).toEqual(['right', 'right', 'right', 'right']);
        expect(positions('center')).toEqual(['left', 'left', 'left', 'right']);
        expect(positions('alternate')).toEqual(['left', 'right', 'left', 'right']);
    });

    it('alternate 只按实际渲染的项交替，条件为假的子节点不占位', () => {
        const { container } = render(
            <Timeline mode="alternate">
                <Timeline.Item>a</Timeline.Item>
                {false}
                <Timeline.Item>b</Timeline.Item>
                {null}
                <Timeline.Item>c</Timeline.Item>
            </Timeline>
        );
        const sides = [...getItems(container)].map((item) => (item.classList.contains(`${prefixCls}-item-left`) ? 'left' : 'right'));
        expect(sides).toEqual(['left', 'right', 'left']);
    });

    it('alternate 按展开 Fragment 后的位置交替', () => {
        const { container } = render(
            <Timeline mode="alternate">
                <Timeline.Item>a</Timeline.Item>
                <>
                    <Timeline.Item>b</Timeline.Item>
                    <Timeline.Item>c</Timeline.Item>
                </>
            </Timeline>
        );
        const sides = [...getItems(container)].map((item) => ['left', 'right'].filter((side) => item.classList.contains(`${prefixCls}-item-${side}`)).join());
        expect(sides).toEqual(['left', 'right', 'left']);
    });

    it('dataSource 的类型不接受 children', () => {
        // @ts-expect-error children would be silently replaced by content
        const data: Data = { content: 'a', children: 'b' };
        expect(data.content).toBe('a');
    });

    it('项目的 className 与位置类名并存，dataSource 同样如此', () => {
        const { container } = render(<Timeline dataSource={[{ content: 'a', className: 'own' }, { content: 'b' }]} mode="alternate" />);
        const items = getItems(container);
        expect(items[0]).toHaveClass('own', `${prefixCls}-item-left`);
        expect(items[1]).toHaveClass(`${prefixCls}-item-right`);
    });

    it('dataSource 为空时渲染 children，并保留非元素子节点', () => {
        const { container } = render(
            <Timeline dataSource={[]}>
                text
                {null}
                <Timeline.Item>a</Timeline.Item>
            </Timeline>
        );
        const list = container.querySelector('ul');
        expect(getItems(container)).toHaveLength(1);
        expect(list.firstChild.nodeValue).toBe('text');
    });

    it('dataSource 内容不会放到项目元素上', () => {
        const { container } = renderTl();
        getItems(container).forEach((item) => expect(item).not.toHaveAttribute('content'));
    });

    it('只在传入时渲染 extra 和 time', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item>a</Timeline.Item>
            </Timeline>
        );
        expect(container.querySelector(`.${prefixCls}-item-content-extra`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item-content`).textContent).toBe('a');
    });

    it('自定义 dot 时标记为装饰，并对辅助技术隐藏 head 和 tail', () => {
        const { container } = render(
            <Timeline>
                <Timeline.Item dot={<span>x</span>}>a</Timeline.Item>
                <Timeline.Item>b</Timeline.Item>
            </Timeline>
        );
        const heads = container.querySelectorAll(`.${prefixCls}-item-head`);
        expect(heads[0]).toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[1]).not.toHaveClass(`${prefixCls}-item-head-custom`);
        expect(heads[0]).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector(`.${prefixCls}-item-tail`)).toHaveAttribute('aria-hidden', 'true');
        expect(heads[1]).not.toHaveAttribute('style');
    });

    it('点击时以点击事件调用项目的 onClick', () => {
        // currentTarget is cleared once dispatch ends, so read it inside the handler
        const onClick = vi.fn<(e: React.MouseEvent) => EventTarget>((e) => e.currentTarget);
        const { container } = render(
            <Timeline>
                <Timeline.Item onClick={onClick}>a</Timeline.Item>
                <Timeline.Item>b</Timeline.Item>
            </Timeline>
        );
        fireEvent.click(getItems(container)[1]);
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.click(getItems(container)[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onClick.mock.results[0].value).toBe(getItems(container)[0]);
    });

    it('可点击项目支持 Enter 和 Space 操作，普通项目不可聚焦', async () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        render(
            <Timeline>
                <Timeline.Item onClick={onClick}>a</Timeline.Item>
                <Timeline.Item>b</Timeline.Item>
            </Timeline>
        );
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(1);
        buttons[0].focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('可点击项目的 extra 在按钮之外，点击其中的控件不触发项目的 onClick', async () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        const onExtra = vi.fn<React.MouseEventHandler>();
        render(
            <Timeline>
                <Timeline.Item extra={<button onClick={onExtra}>more</button>} onClick={onClick}>
                    a
                </Timeline.Item>
            </Timeline>
        );
        const main = screen.getByRole('button', { name: 'a' });
        expect(main).not.toContainElement(screen.getByText('more'));
        await userEvent.click(screen.getByText('more'));
        expect(onExtra).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(main);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('extra 内 Portal 弹层的点击不触发项目的 onClick', async () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        render(
            <Timeline>
                <Timeline.Item extra={createPortal(<button type="button">InPortal</button>, document.body)} onClick={onClick}>
                    a
                </Timeline.Item>
            </Timeline>
        );
        await userEvent.click(screen.getByText('InPortal'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('嵌套在外层 extra 里的可点击项目仍触发自己的 onClick，外层不触发', async () => {
        const outer = vi.fn<React.MouseEventHandler>();
        const inner = vi.fn<React.MouseEventHandler>();
        render(
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
        );
        await userEvent.click(screen.getByRole('button', { name: 'nested' }));
        expect(inner).toHaveBeenCalledTimes(1);
        expect(outer).not.toHaveBeenCalled();
    });

    it('aria-label 和 data-* 透传到列表，data-* 透传到项目', () => {
        const { container } = render(
            <Timeline data-testid="tl" aria-label="history">
                <Timeline.Item data-id="1">a</Timeline.Item>
            </Timeline>
        );
        const list = screen.getByTestId('tl');
        expect(list.tagName).toBe('UL');
        expect(list).toHaveAttribute('aria-label', 'history');
        expect(getItems(container)[0]).toHaveAttribute('data-id', '1');
        expect(getItems(container)[0].tagName).toBe('LI');
    });

    it('Timeline 读取 semiGlobal overrideDefaultProps 的默认值，Timeline.Item 不读取', () => {
        const before = semiGlobal.config.overrideDefaultProps;
        // TimelineItem is deliberately not a known key: Timeline.Item must ignore it
        semiGlobal.config.overrideDefaultProps = {
            Timeline: { mode: 'right' },
            TimelineItem: { type: 'error' },
        } as typeof before;
        try {
            const { container } = renderTl();
            expect(container.querySelector('ul')).toHaveClass(`${prefixCls}-right`);
            expect(getItems(container)[3].querySelector(`.${prefixCls}-item-head-success`)).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = before;
        }
    });

    it('ref 绑定到列表，项目的 ref 绑定到其 li', () => {
        const ref = createRef<HTMLUListElement>();
        const itemRef = createRef<HTMLLIElement>();
        const { container } = render(
            <Timeline ref={ref}>
                <Timeline.Item ref={itemRef}>a</Timeline.Item>
            </Timeline>
        );
        expect(ref.current).toBe(container.querySelector('ul'));
        expect(itemRef.current).toBe(getItems(container)[0]);
    });

    it('其他未声明属性透传到根元素', () => {
        const onMouseEnter = vi.fn<React.MouseEventHandler>();
        const listAttrs = { id: 'tl', title: 'history' };
        const itemAttrs = { id: 'first', position: 'right', onMouseEnter } as const;
        const { container } = render(
            <Timeline {...listAttrs}>
                <Timeline.Item {...itemAttrs}>a</Timeline.Item>
            </Timeline>
        );
        const list = container.querySelector('ul');
        expect(list).toHaveAttribute('id', 'tl');
        expect(list).toHaveAttribute('title', 'history');
        expect(getItems(container)[0]).toHaveAttribute('id', 'first');
        expect(getItems(container)[0]).not.toHaveAttribute('position');
        fireEvent.mouseEnter(getItems(container)[0]);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('StrictMode 下渲染结果一致', () => {
        const { container } = render(
            <StrictMode>
                <Timeline dataSource={dataSource} mode="alternate" />
            </StrictMode>
        );
        const items = getItems(container);
        expect(items).toHaveLength(4);
        expect(items[1]).toHaveClass(`${prefixCls}-item-right`);
        expect(items[1].querySelector(`.${prefixCls}-item-head`)).toHaveStyle({
            backgroundColor: 'rgb(255, 192, 203)',
        });
    });
});
