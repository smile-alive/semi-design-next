import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Input, Popover, Select, Tag } from '@fibrae/semi-ui-react';
import type { RenderContentProps } from '@fibrae/semi-ui-react/tooltip';

const popStyle = { height: 200, width: 200 };

const renderContent = () => (
    <div style={popStyle} data-testid="pop">
        <button>first focusable</button>
        <a href="https://semi.design">link</a>
        <input defaultValue="semi" placeholder="" />
        <a href="https://semi.design">link2</a>
        <button>last focusable</button>
    </div>
);

const initFocusContent = ({ initialFocusRef }: RenderContentProps) => (
    <div style={popStyle} data-testid="pop">
        <button>first focusable</button>
        <input ref={initialFocusRef} data-testid="initial-focus-input" defaultValue="semi" placeholder="" />
        <button>last focusable</button>
    </div>
);

const first = () => screen.getByRole('button', { name: 'first focusable' });
const last = () => screen.getByRole('button', { name: 'last focusable' });

function CustomTrigger() {
    const [visible, setVisible] = useState(false);
    return (
        <Popover content={renderContent} trigger="custom" visible={visible} onEscKeyDown={() => setVisible(false)}>
            <Button onClick={() => setVisible(!visible)}>custom</Button>
        </Popover>
    );
}

describe('Popover（浏览器）', () => {
    it('ShadowRoot 内用键盘打开，焦点在弹层内时 Escape 关闭后焦点回到触发按钮', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            <Popover aria-label="Details" content={<input aria-label="shadow input" />} motion={false} returnFocusOnClose trigger="click">
                <button>shadow trigger</button>
            </Popover>,
            { container: mount }
        );
        try {
            const trigger = shadow.querySelector('button');
            trigger.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.querySelector('input')).not.toBeNull());
            shadow.querySelector('input').focus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(shadow.querySelector('[popover]')).toBeNull());
            expect(shadow.activeElement).toBe(trigger);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('trigger=click 与键盘操作', async () => {
        render(
            <Popover content={renderContent} motion={false} trigger="click">
                <Button>click</Button>
            </Popover>
        );
        const trigger = screen.getByRole('button', { name: 'click' });
        await userEvent.click(trigger);
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first()).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(trigger).toHaveFocus());

        await userEvent.click(trigger);
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(last()).toHaveFocus());
    });

    it('trigger=focus 与键盘操作', async () => {
        render(
            <Popover content={renderContent} trigger="focus">
                <Input style={{ width: 150 }} data-testid="focus" defaultValue="focus" />
            </Popover>
        );
        const trigger = screen.getByTestId('focus');
        trigger.focus();
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first()).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('pop')).toBeNull());

        trigger.blur();
        trigger.focus();
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(last()).toHaveFocus());
    });

    it('trigger=custom 与键盘操作', async () => {
        render(<CustomTrigger />);
        const trigger = screen.getByRole('button', { name: 'custom' });
        await userEvent.click(trigger);
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first()).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('pop')).toBeNull());

        await userEvent.click(trigger);
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(last()).toHaveFocus());
    });

    it('trigger=click 与焦点保护', async () => {
        render(
            <Popover content={renderContent} motion={false} trigger="click">
                <Button>click</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'click' }));
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(last()).toHaveFocus());
        await userEvent.keyboard('{Tab}');
        expect(first()).toHaveFocus();
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(last()).toHaveFocus();
    });

    it('trigger=click 与初始焦点', async () => {
        render(
            <Popover content={initFocusContent} motion={false} trigger="click">
                <Button>custom initialFocus</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'custom initialFocus' }));
        await waitFor(() => expect(screen.getByTestId('initial-focus-input')).toHaveFocus());
    });

    it('初始焦点通过 InputHandle 设置', async () => {
        render(
            <Popover
                content={({ initialFocusRef }) => (
                    <div style={popStyle}>
                        <button>first focusable</button>
                        <Input ref={initialFocusRef} aria-label="handle input" />
                    </div>
                )}
                motion={false}
                trigger="click"
            >
                <Button>handle initialFocus</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'handle initialFocus' }));
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'handle input' })).toHaveFocus());
    });

    it('trigger=click 且 closeOnEsc=false', async () => {
        render(
            <Popover closeOnEsc={false} content={renderContent} motion={false} trigger="click">
                <Button>closeOnEsc=false</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'closeOnEsc=false' }));
        // The popup stays transparent until it is positioned
        await waitFor(() => expect(screen.getByTestId('pop')).toBeVisible());
        await userEvent.keyboard('{Escape}');
        expect(screen.getByTestId('pop')).toBeVisible();
    });

    it('showArrow 的 TR、RB、BR、LB 箭头落在触发器中心附近', async () => {
        render(
            <div style={{ margin: '280px 0 0 420px', display: 'grid', gap: 80 }}>
                {(
                    [
                        ['topRight', 'TR'],
                        ['rightBottom', 'RB'],
                        ['bottomRight', 'BR'],
                        ['leftBottom', 'LB'],
                    ] as const
                ).map(([position, label]) => (
                    <Popover key={position} content={<article style={{ width: 180 }}>card</article>} motion={false} position={position} showArrow trigger="click">
                        <Button>{label}</Button>
                    </Popover>
                ))}
            </div>
        );
        for (const label of ['TR', 'RB', 'BR', 'LB']) {
            const button = screen.getByRole('button', { name: label });
            await userEvent.click(button);
            const pop = document.querySelector<HTMLElement>('.semi-popover-wrapper');
            const buttonRect = button.getBoundingClientRect();
            const popRect = pop.getBoundingClientRect();
            const centerX = buttonRect.left + buttonRect.width / 2;
            const centerY = buttonRect.top + buttonRect.height / 2;
            const coversCenter = (popRect.left <= centerX && popRect.right >= centerX) || (popRect.top <= centerY && popRect.bottom >= centerY);
            expect(coversCenter).toBe(true);
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(document.querySelector('.semi-popover-wrapper')).toBeNull());
        }
    });

    it('trigger=click 且 returnFocusOnClose=false', async () => {
        render(
            <Popover content={renderContent} motion={false} returnFocusOnClose={false} trigger="click">
                <Button>returnFocusOnClose=false</Button>
            </Popover>
        );
        const trigger = screen.getByRole('button', { name: 'returnFocusOnClose=false' });
        await userEvent.click(trigger);
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first()).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('pop')).toBeNull());
        expect(trigger).not.toHaveFocus();
    });

    it('点击 Popover 中的 Select 选项', async () => {
        const { container } = render(
            <div style={{ paddingLeft: 100 }}>
                <Popover
                    content={
                        <div style={{ padding: 20 }} data-testid="select-in-popover">
                            <Select style={{ width: 120 }} defaultValue="abc">
                                <Select.Option value="abc">抖音</Select.Option>
                                <Select.Option value="hotsoon">火山</Select.Option>
                                <Select.Option disabled value="pipixia">
                                    皮皮虾
                                </Select.Option>
                                <Select.Option value="xigua">西瓜视频</Select.Option>
                            </Select>
                        </div>
                    }
                    showArrow
                    trigger="click"
                >
                    <Tag>点击此处</Tag>
                </Popover>
            </div>
        );
        await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-tag`));
        const select = (await screen.findByTestId('select-in-popover')).querySelector(`.${BASE_CLASS_PREFIX}-select`);
        await userEvent.click(select);
        await userEvent.click(await screen.findByText('西瓜视频'));
        // Clicking inside the nested Select popup must not count as a click outside the Popover (#818)
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-select-option-list`)).toBeNull());
        expect(select).toBeVisible();
        expect(select).toHaveTextContent('西瓜视频');
    });
});
