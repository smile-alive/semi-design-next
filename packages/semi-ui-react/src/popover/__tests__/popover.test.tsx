import { StrictMode, createRef, useState } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Select, Tag } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { RenderContent } from '@fibrae/semi-ui-react/tooltip';
import Popover, { type PopoverHandle, type PopoverProps } from '../index';

const wrapSelector = `.${BASE_CLASS_PREFIX}-popover`;
const arrowSelector = `.${BASE_CLASS_PREFIX}-popover-icon-arrow`;
// Tooltip names its wrapper after Popover's prefixCls
const tooltipWrapperSelector = `.${BASE_CLASS_PREFIX}-popover-wrapper`;

describe(`Popover`, () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it(`外观`, () => {
        render(
            <Popover content={<p>I&apos;m content</p>} showArrow trigger="hover" visible>
                <Button>Hover Me</Button>
            </Popover>
        );

        const popover = document.querySelector(wrapSelector);
        expect(popover).not.toBeNull();
        expect(popover).toContainElement(screen.getByText("I'm content"));

        expect(document.querySelector(arrowSelector)).not.toBeNull();
    });

    it(`无箭头时的外观`, () => {
        render(
            <Popover content={<p>I&apos;m content</p>} spacing={0} trigger="hover" visible>
                <Button>Hover Me</Button>
            </Popover>
        );

        const popover = document.querySelector(wrapSelector);
        expect(popover).not.toBeNull();
        expect(popover).toContainElement(screen.getByText("I'm content"));

        expect(document.querySelector(arrowSelector)).toBeNull();
    });

    // The Select dropdown portals outside the Popover DOM; its mousedown must not count as a click outside
    it('FixNestedPopover #818: 在 click Popover 内的 Select 中选择选项后，Popover 保持打开', async () => {
        render(
            <Popover
                content={
                    <div style={{ padding: 20 }}>
                        <Select style={{ width: 120 }} defaultValue="abc">
                            <Select.Option value="abc">抖音</Select.Option>
                            <Select.Option value="hotsoon">火山</Select.Option>
                            <Select.Option value="xigua">西瓜视频</Select.Option>
                        </Select>
                    </div>
                }
                showArrow
                trigger="click"
            >
                <Tag>点击此处</Tag>
            </Popover>
        );

        await userEvent.click(screen.getByText('点击此处'));
        const popover = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(wrapSelector);
            expect(node).not.toBeNull();
            return node;
        });
        await userEvent.click(within(popover).getByRole('combobox'));
        await userEvent.click(await screen.findByText('西瓜视频'));

        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-select-option`)).toBeNull());
        expect(document.querySelector(wrapSelector)).toBe(popover);
        expect(within(popover).getByRole('combobox')).toHaveTextContent('西瓜视频');
    });

    it('非受控的 click 触发器点击显示，点击外部隐藏并以原生 MouseEvent 调用 onClickOutSide', async () => {
        expectTypeOf<Parameters<NonNullable<PopoverProps['onClickOutSide']>>[0]>().toEqualTypeOf<MouseEvent>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onClickOutSide = vi.fn<(e: MouseEvent) => void>();
        render(
            <Popover content="pop content" motion={false} trigger="click" onClickOutSide={onClickOutSide} onVisibleChange={onVisibleChange}>
                <Button>toggle</Button>
            </Popover>
        );
        expect(document.querySelector(wrapSelector)).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        await waitFor(() => expect(screen.getByText('pop content')).toBeInTheDocument());
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
        // clickTriggerToHide is off: a second click on the trigger keeps it open
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByText('pop content')).toBeInTheDocument();
        // a click inside the popup is not a click outside (F3)
        await userEvent.click(screen.getByText('pop content'));
        expect(screen.getByText('pop content')).toBeInTheDocument();
        expect(onClickOutSide).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        await waitFor(() => expect(screen.queryByText('pop content')).toBeNull());
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(false));
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        const event = onClickOutSide.mock.calls[0][0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event).not.toHaveProperty('nativeEvent');
    });

    it('受控 visible 配合自定义触发器时只跟随属性，不调用 onVisibleChange，打开后调用 afterOpen', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const afterOpen = vi.fn<() => void>();
        const renderCtrl = (visible) => (
            <Popover afterOpen={afterOpen} content="ctrl" motion={false} trigger="custom" visible={visible} onVisibleChange={onVisibleChange}>
                <Button>ctrl trigger</Button>
            </Popover>
        );
        const { rerender } = render(renderCtrl(false));
        await userEvent.click(screen.getByRole('button', { name: 'ctrl trigger' }));
        expect(screen.queryByText('ctrl')).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();

        rerender(renderCtrl(true));
        await waitFor(() => expect(screen.getByText('ctrl')).toBeInTheDocument());
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        rerender(renderCtrl(false));
        await waitFor(() => expect(screen.queryByText('ctrl')).toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('showArrow 按位置渲染 svg 箭头，并使用 arrowStyle 的颜色', async () => {
        const { unmount } = render(
            <Popover arrowStyle={{ backgroundColor: 'red' }} content="left" position="left" showArrow trigger="custom" visible>
                <span>left trigger</span>
            </Popover>
        );
        await waitFor(() => expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('x-placement', 'left'));
        const wrapper = document.querySelector(tooltipWrapperSelector);
        expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        const paths = document.querySelectorAll<SVGPathElement>(`${arrowSelector} path`);
        expect(paths).toHaveLength(2);
        expect(paths[0].getAttribute('d').startsWith('M0.5 0L1.5 0')).toBe(true);
        expect(paths[1].style.fill).toBe('red');
        unmount();

        render(
            <Popover style={{ backgroundColor: 'blue' }} content="top" position="top" showArrow trigger="custom" visible>
                <span>top trigger</span>
            </Popover>
        );
        await waitFor(() => expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('x-placement', 'top'));
        const topPaths = document.querySelectorAll<SVGPathElement>(`${arrowSelector} path`);
        expect(topPaths[0].getAttribute('d').startsWith('M0 0.5L0 1.5')).toBe(true);
        // without arrowStyle the arrow takes the popup background
        expect(topPaths[1].style.fill).toBe('blue');
    });

    it('content 为函数时接收 initialFocusRef；contentClassName 与 prefixCls 作用于卡片', () => {
        const content = vi.fn<RenderContent>(({ initialFocusRef }) => <input ref={initialFocusRef} aria-label="inner" />);
        render(
            <Popover contentClassName="my-card" content={content} prefixCls="my-pop" trigger="custom" visible>
                <span>fn trigger</span>
            </Popover>
        );
        expect(content).toHaveBeenCalledWith({
            initialFocusRef: expect.objectContaining({ current: expect.anything() }),
        });
        const card = screen.getByRole('textbox', { name: 'inner' }).parentElement.parentElement;
        expect(card).toHaveClass('my-pop', 'my-card');
        expect(screen.getByRole('textbox', { name: 'inner' }).parentElement).toHaveClass('my-pop-content');
    });

    it('click 或自定义触发器生成对话框，hover 生成 tooltip', async () => {
        const { unmount } = render(
            <Popover content="dialog content" trigger="custom" visible>
                <Button>dialog trigger</Button>
            </Popover>
        );
        const dialogTrigger = screen.getByRole('button', { name: 'dialog trigger' });
        expect(dialogTrigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('role', 'dialog');
        unmount();

        render(
            <Popover content="tip content" visible>
                <Button>tip trigger</Button>
            </Popover>
        );
        const tipTrigger = screen.getByRole('button', { name: 'tip trigger' });
        expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('role', 'tooltip');
        expect(tipTrigger).toHaveAttribute('aria-describedby', document.querySelector(tooltipWrapperSelector).id);
    });

    it('contextMenu 触发器与 click 一样生成对话框', async () => {
        render(
            <Popover aria-label="context menu dialog" content="context content" trigger="contextMenu">
                <Button>context trigger</Button>
            </Popover>
        );
        const trigger = screen.getByRole('button', { name: 'context trigger' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.pointer({ keys: '[MouseRight]', target: trigger });
        expect(await screen.findByRole('dialog', { name: 'context menu dialog' })).toHaveTextContent('context content');
    });

    it('只有带交互角色的触发器才携带对话框弹层状态', async () => {
        const { unmount } = render(
            <Popover content="popup" trigger="click">
                <span>generic trigger</span>
            </Popover>
        );
        const generic = screen.getByText('generic trigger');
        await userEvent.click(generic);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(generic).not.toHaveAttribute('aria-expanded');
        expect(generic).not.toHaveAttribute('aria-haspopup');
        unmount();

        render(
            <Popover content="popup" trigger="click">
                <button type="button">native trigger</button>
            </Popover>
        );
        const native = screen.getByRole('button', { name: 'native trigger' });
        expect(native).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(native);
        await waitFor(() => expect(native).toHaveAttribute('aria-expanded', 'true'));
        expect(native).toHaveAttribute('aria-haspopup', 'dialog');
        expect(native).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
    });

    it('hover 触发器在未设置 disableFocusListener 时也会因 focus 打开', async () => {
        const { rerender } = render(
            <Popover content="focus content" motion={false}>
                <Button>hover trigger</Button>
            </Popover>
        );
        await userEvent.tab();
        expect(await screen.findByText('focus content')).toBeInTheDocument();
        await userEvent.tab();
        await waitFor(() => expect(screen.queryByText('focus content')).toBeNull());

        rerender(
            <Popover content="focus content" disableFocusListener motion={false}>
                <Button>hover trigger</Button>
            </Popover>
        );
        await userEvent.tab({ shift: true });
        expect(screen.getByRole('button', { name: 'hover trigger' })).toHaveFocus();
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(screen.queryByText('focus content')).toBeNull();
    });

    it('ref.focusTrigger 使触发元素获得焦点', async () => {
        const ref = createRef<PopoverHandle>();
        render(
            <Popover ref={ref} content="ref content" motion={false} trigger="click">
                <Button>ref trigger</Button>
            </Popover>
        );
        act(() => ref.current.focusTrigger());
        expect(screen.getByRole('button', { name: 'ref trigger' })).toHaveFocus();
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Popover: { showArrow: true, trigger: 'click' } };
        try {
            render(
                <Popover content="global" motion={false}>
                    <Button>global trigger</Button>
                </Popover>
            );
            await userEvent.click(screen.getByRole('button', { name: 'global trigger' }));
            await waitFor(() => expect(screen.getByText('global')).toBeInTheDocument());
            expect(document.querySelector(arrowSelector)).not.toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下正常工作', async () => {
        function Toggle() {
            const [visible, setVisible] = useState(false);
            return (
                <Popover content="strict content" motion={false} trigger="custom" visible={visible}>
                    <Button onClick={() => setVisible((v) => !v)}>strict trigger</Button>
                </Popover>
            );
        }
        render(
            <StrictMode>
                <Toggle />
            </StrictMode>
        );
        await userEvent.click(screen.getByRole('button', { name: 'strict trigger' }));
        await waitFor(() => expect(screen.getByText('strict content')).toBeInTheDocument());
        await userEvent.click(screen.getByRole('button', { name: 'strict trigger' }));
        await waitFor(() => expect(screen.queryByText('strict content')).toBeNull());
    });

    // Popover has no DOM of its own: unknown props go to Tooltip, which does not forward them anywhere
    it('Popover 上的 data-* 既不落在触发器上，也不落在弹层上', () => {
        render(
            <Popover data-testid="pop-attr" content={<span data-testid="inner">inner</span>} trigger="custom" visible>
                <Button data-testid="trigger-attr">attr trigger</Button>
            </Popover>
        );
        expect(screen.getByTestId('trigger-attr')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();
        expect(screen.queryByTestId('pop-attr')).toBeNull();
    });

    it('对话框 Popover 上的 aria-label 与 aria-labelledby 为对话框命名，而非触发器', () => {
        const { unmount } = render(
            <Popover aria-label="Details" content="dialog content" trigger="custom" visible>
                <Button>dialog trigger</Button>
            </Popover>
        );
        expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'dialog trigger' })).not.toHaveAttribute('aria-label');
        unmount();

        render(
            <Popover aria-labelledby="pop-title" content="dialog content" trigger="custom" visible>
                <Button>dialog trigger</Button>
            </Popover>
        );
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'pop-title');
    });

    it('tooltip 类型的 Popover 不接受 aria-label', () => {
        render(
            <Popover aria-label="Details" content="tip content" visible>
                <Button>tip trigger</Button>
            </Popover>
        );
        expect(screen.getByRole('tooltip')).not.toHaveAttribute('aria-label');
    });

    it('对话框 Popover 未命名打开时只告警一次，命名后不告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const nameWarnings = () => warn.mock.calls.filter(([message]) => message.includes('[Semi Popover]'));
        try {
            const { unmount } = render(
                <Popover content="unnamed content" trigger="click">
                    <Button>unnamed trigger</Button>
                </Popover>
            );
            await userEvent.click(screen.getByRole('button', { name: 'unnamed trigger' }));
            await screen.findByRole('dialog');
            expect(nameWarnings()).toHaveLength(1);
            unmount();
            warn.mockClear();

            render(
                <Popover aria-labelledby="pop-heading" content={<h4 id="pop-heading">Heading</h4>} trigger="custom" visible>
                    <Button>named trigger</Button>
                </Popover>
            );
            expect(await screen.findByRole('dialog', { name: 'Heading' })).toBeInTheDocument();
            expect(nameWarnings()).toHaveLength(0);
        } finally {
            warn.mockRestore();
        }
    });

    it('未命名的自定义触发器对话框 Popover 同样告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            render(
                <Popover content="controlled content" trigger="custom" visible>
                    <Button>controlled trigger</Button>
                </Popover>
            );
            await screen.findByRole('dialog');
            expect(warn.mock.calls.filter(([message]) => message.includes('[Semi Popover]'))).toHaveLength(1);
        } finally {
            warn.mockRestore();
        }
    });

    it('role="presentation" 生成的弹层既不是对话框，也不描述触发器', () => {
        render(
            <Popover role="presentation" content="list content" trigger="custom" visible>
                <select aria-controls="list">
                    <option>combobox</option>
                </select>
            </Popover>
        );
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('role', 'presentation');
        const trigger = screen.getByRole('combobox');
        expect(trigger).not.toHaveAttribute('aria-haspopup');
        expect(trigger).not.toHaveAttribute('aria-describedby');
        expect(trigger).toHaveAttribute('aria-controls', 'list');
    });

    it('打开中卸载时异步补调一次 afterClose，StrictMode 的模拟卸载不算', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(
            <StrictMode>
                <Popover afterClose={afterClose} content="content" motion={false} trigger="custom" visible>
                    <Button>trigger</Button>
                </Popover>
            </StrictMode>
        );
        await screen.findByRole('dialog');
        await act(async () => {});
        expect(afterClose).not.toHaveBeenCalled();
        unmount();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);
    });
});
