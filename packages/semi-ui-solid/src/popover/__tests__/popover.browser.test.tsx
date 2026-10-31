import { For, createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import Popover from '..';
import Button from '../../button';
import type { Position, RenderContentProps } from '../../tooltip';

const popStyle = { height: '200px', width: '200px' };

const renderContent = () => (
    <div style={popStyle} data-testid="pop">
        <button>first focusable</button>
        <a href="https://semi.design">link</a>
        <input value="semi" placeholder="" />
        <a href="https://semi.design">link2</a>
        <button>last focusable</button>
    </div>
);

const initFocusContent = ({ initialFocusRef }: RenderContentProps) => (
    <div style={popStyle} data-testid="pop">
        <button>first focusable</button>
        <input ref={initialFocusRef} data-testid="initial-focus-input" value="semi" placeholder="" />
        <button>last focusable</button>
    </div>
);

const first = () => screen.getByRole('button', { name: 'first focusable' });
const last = () => screen.getByRole('button', { name: 'last focusable' });

function CustomTrigger() {
    const [visible, setVisible] = createSignal(false);
    return (
        <Popover aria-label="Details" content={renderContent} trigger="custom" visible={visible()} onEscKeyDown={() => setVisible(false)}>
            {(t) => <Button {...t({ onClick: () => setVisible(!visible()) })}>custom</Button>}
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
            () => (
                <Popover aria-label="Details" content={<input aria-label="shadow input" />} motion={false} returnFocusOnClose trigger="click">
                    {(t) => <button {...t()}>shadow trigger</button>}
                </Popover>
            ),
            { container: mount }
        );
        try {
            const trigger = shadow.querySelector('button') as HTMLButtonElement;
            trigger.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.querySelector('input')).not.toBeNull());
            shadow.querySelector('input')?.focus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(shadow.querySelector('[popover]')).toBeNull());
            expect(shadow.activeElement).toBe(trigger);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('trigger=click 与键盘操作', async () => {
        render(() => (
            <Popover aria-label="Details" content={renderContent} motion={false} trigger="click">
                {(t) => <Button {...t()}>click</Button>}
            </Popover>
        ));
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
        render(() => (
            <Popover aria-label="Details" content={renderContent} trigger="focus">
                {(t) => <input {...t()} style={{ width: '150px' }} data-testid="focus" value="focus" />}
            </Popover>
        ));
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
        render(() => <CustomTrigger />);
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
        render(() => (
            <Popover aria-label="Details" content={renderContent} motion={false} trigger="click">
                {(t) => <Button {...t()}>click</Button>}
            </Popover>
        ));
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
        render(() => (
            <Popover aria-label="Details" content={initFocusContent} motion={false} trigger="click">
                {(t) => <Button {...t()}>custom initialFocus</Button>}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'custom initialFocus' }));
        await waitFor(() => expect(screen.getByTestId('initial-focus-input')).toHaveFocus());
    });

    it('trigger=click 且 closeOnEsc=false', async () => {
        render(() => (
            <Popover aria-label="Details" closeOnEsc={false} content={renderContent} motion={false} trigger="click">
                {(t) => <Button {...t()}>closeOnEsc=false</Button>}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'closeOnEsc=false' }));
        // The popup stays transparent until it is positioned
        await waitFor(() => expect(screen.getByTestId('pop')).toBeVisible());
        await userEvent.keyboard('{Escape}');
        expect(screen.getByTestId('pop')).toBeVisible();
    });

    it('showArrow 的 TR、RB、BR、LB 箭头落在触发器中心附近', async () => {
        const cases: [Position, string][] = [
            ['topRight', 'TR'],
            ['rightBottom', 'RB'],
            ['bottomRight', 'BR'],
            ['leftBottom', 'LB'],
        ];
        render(() => (
            <div style={{ margin: '280px 0 0 420px', display: 'grid', gap: '80px' }}>
                <For each={cases}>
                    {([position, label]) => (
                        <Popover aria-label="Details" content={<article style={{ width: '180px' }}>card</article>} motion={false} position={position} showArrow trigger="click">
                            {(t) => <Button {...t()}>{label}</Button>}
                        </Popover>
                    )}
                </For>
            </div>
        ));
        for (const [, label] of cases) {
            const button = screen.getByRole('button', { name: label });
            await userEvent.click(button);
            const pop = document.querySelector<HTMLElement>('.semi-popover-wrapper') as HTMLElement;
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
        render(() => (
            <Popover aria-label="Details" content={renderContent} motion={false} returnFocusOnClose={false} trigger="click">
                {(t) => <Button {...t()}>returnFocusOnClose=false</Button>}
            </Popover>
        ));
        const trigger = screen.getByRole('button', { name: 'returnFocusOnClose=false' });
        await userEvent.click(trigger);
        await screen.findByTestId('pop');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(first()).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('pop')).toBeNull());
        expect(trigger).not.toHaveFocus();
    });
});
