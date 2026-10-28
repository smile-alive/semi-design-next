import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tab } from '@test/utils/browser';
import { sleep } from '@test/utils/solid';
import Dropdown from '..';
import Avatar from '../../avatar';
import Button from '../../button';

type Callback = () => void;

const item = (name: string) => screen.getByText(name, { selector: '[role="menuitem"]' });
const portals = () => document.querySelectorAll('.semi-dropdown-wrapper');

function HoverNested(props: { onDeep?: Callback }) {
    return (
        <Dropdown
            render={
                <Dropdown.Menu>
                    <Dropdown.Item>Alpha</Dropdown.Item>
                    <Dropdown
                        position="rightTop"
                        render={
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => props.onDeep?.()}>Deep one</Dropdown.Item>
                                <Dropdown.Item>Deep two</Dropdown.Item>
                            </Dropdown.Menu>
                        }
                    >
                        {(t) => <Dropdown.Item {...t()}>Parent</Dropdown.Item>}
                    </Dropdown>
                    <Dropdown.Item>Omega</Dropdown.Item>
                </Dropdown.Menu>
            }
            trigger="click"
        >
            {(t) => <button {...t()}>hover nested</button>}
        </Dropdown>
    );
}

describe('Dropdown 键盘操作（浏览器）', () => {
    it('ShadowRoot 内用键盘打开后焦点落在首项', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            () => (
                <Dropdown
                    menu={[
                        { node: 'item', name: 'Alpha' },
                        { node: 'item', name: 'Beta' },
                    ]}
                    motion={false}
                    trigger="click"
                >
                    {(t) => <button {...t()}>shadow trigger</button>}
                </Dropdown>
            ),
            { container: mount }
        );
        try {
            shadow.querySelector('button')?.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(shadow.activeElement).toHaveTextContent('Alpha'));
            expect(shadow.activeElement).toHaveAttribute('role', 'menuitem');
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('文本输入框作触发器时，Enter 照常隐式提交表单而不打开菜单', async () => {
        const onSubmit = vi.fn<(event: SubmitEvent) => void>((event) => event.preventDefault());
        render(() => (
            <form onSubmit={onSubmit}>
                <Dropdown menu={[{ node: 'item', name: 'Alpha' }]} motion={false} trigger="click">
                    {(t) => <input aria-label="search" {...t()} />}
                </Dropdown>
            </form>
        ));
        screen.getByRole('textbox', { name: 'search' }).focus();
        await userEvent.keyboard('{Enter}');
        await sleep(50);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(portals()).toHaveLength(0);
    });

    it.each(['{Enter}', ' '])('在 %s 上对原生按钮触发器只点击一次', async (key) => {
        const onClick = vi.fn<Callback>();
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Alpha</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                {(t) => (
                    <button onClick={onClick} {...t()}>
                        native
                    </button>
                )}
            </Dropdown>
        ));
        screen.getByRole('button', { name: 'native' }).focus();
        await userEvent.keyboard(key);
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('按 Enter 打开，进入悬停子菜单后再返回，并按 Escape 关闭', async () => {
        const onDeep = vi.fn<Callback>();
        render(() => <HoverNested onDeep={onDeep} />);
        const button = screen.getByRole('button', { name: 'hover nested' });
        button.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Parent')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Deep one')).toHaveFocus());
        await userEvent.keyboard('{End}');
        expect(item('Deep two')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(item('Deep one')).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(onDeep).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Enter}');
        expect(onDeep).toHaveBeenCalledTimes(2);
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(item('Parent')).toHaveFocus());
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Omega')).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button).toHaveFocus();
    });

    it('通过聚焦触发器打开的悬停菜单，在焦点进入悬停子菜单期间保持打开', async () => {
        const onDeep = vi.fn<Callback>();
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown
                            position="rightTop"
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={onDeep}>Leaf</Dropdown.Item>
                                </Dropdown.Menu>
                            }
                        >
                            {(t) => <Dropdown.Item {...t()}>Branch</Dropdown.Item>}
                        </Dropdown>
                    </Dropdown.Menu>
                }
            >
                {(t) => <button {...t()}>all hover</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'all hover' });
        button.focus();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Branch')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Leaf')).toHaveFocus());
        // longer than the leave delay: neither menu closes behind the focus
        await sleep(300);
        expect(item('Leaf')).toHaveFocus();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Enter}');
        expect(onDeep).toHaveBeenCalledTimes(1);
    });

    it('指针从悬停菜单移入悬停子菜单时两层都保持打开，离开后都关闭', async () => {
        render(() => (
            <>
                <Dropdown
                    render={
                        <Dropdown.Menu>
                            <Dropdown
                                position="rightTop"
                                render={
                                    <Dropdown.Menu>
                                        <Dropdown.Item>Pointer leaf</Dropdown.Item>
                                    </Dropdown.Menu>
                                }
                            >
                                {(t) => <Dropdown.Item {...t()}>Pointer branch</Dropdown.Item>}
                            </Dropdown>
                        </Dropdown.Menu>
                    }
                >
                    {(t) => <button {...t()}>pointer hover</button>}
                </Dropdown>
                <button style={{ 'margin-top': '300px' }}>away</button>
            </>
        ));
        await userEvent.hover(screen.getByRole('button', { name: 'pointer hover' }));
        await waitFor(() => expect(item('Pointer branch')).toBeVisible());
        await userEvent.hover(item('Pointer branch'));
        await waitFor(() => expect(item('Pointer leaf')).toBeVisible());
        await userEvent.hover(item('Pointer leaf'));
        // longer than the leave delay of both menus
        await sleep(300);
        expect(portals()).toHaveLength(2);
        expect(item('Pointer branch')).toHaveAttribute('aria-expanded', 'true');
        await userEvent.hover(screen.getByRole('button', { name: 'away' }));
        await waitFor(() => expect(portals()).toHaveLength(0));
    });

    it('悬停子菜单中按 Escape 只关闭子菜单', async () => {
        render(() => <HoverNested />);
        const button = screen.getByRole('button', { name: 'hover nested' });
        await userEvent.click(button);
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Deep one')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Parent')).toHaveFocus();
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it.each(['{Escape}', '{ArrowLeft}'])('悬停子菜单被 %s 关闭后，父项上按 ArrowRight 再次打开', async (key) => {
        render(() => <HoverNested />);
        await userEvent.click(screen.getByRole('button', { name: 'hover nested' }));
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Deep one')).toHaveFocus());
        await userEvent.keyboard(key);
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Parent')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Deep one')).toHaveFocus());
    });

    it('Tab 关闭所有菜单并将焦点继续移动，而非返回触发器', async () => {
        render(() => (
            <>
                <HoverNested />
                <button>after</button>
            </>
        ));
        const button = screen.getByRole('button', { name: 'hover nested' });
        await userEvent.click(button);
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Deep one')).toHaveFocus());
        await tab();
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('悬停菜单内按 Tab 关闭后焦点落到触发器之后的元素，菜单不因触发器获得焦点重新打开', async () => {
        render(() => (
            <>
                <Dropdown
                    render={
                        <Dropdown.Menu>
                            <Dropdown.Item>Alpha</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                >
                    {(t) => <button {...t()}>all hover</button>}
                </Dropdown>
                <button>after</button>
            </>
        ));
        const button = screen.getByRole('button', { name: 'all hover' });
        button.focus();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Alpha')).toHaveFocus();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        await sleep(300);
        expect(portals()).toHaveLength(0);
        expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('在已打开菜单的触发器上按 Tab 会关闭菜单', async () => {
        render(() => <HoverNested />);
        const button = screen.getByRole('button', { name: 'hover nested' });
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        button.focus();
        await tab();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
    });

    // the close must not leave the popup pinned shut, as a `visible={false}` passed to Tooltip would
    it('被 Tab 关闭的菜单可再次打开', async () => {
        render(() => (
            <Dropdown menu={[{ node: 'item', name: 'Alpha' }]} trigger="click">
                {(t) => <button {...t()}>click menu</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'click menu' });
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        button.focus();
        await tab();
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
    });

    // as when the item opens a Modal: the Enter that activated the item must not also press the dialog's first button
    it('在把焦点移到按钮的菜单项上按 Enter 不会点击该按钮', async () => {
        const onConfirm = vi.fn<Callback>();
        render(() => (
            <>
                <Dropdown
                    render={
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => screen.getByRole('button', { name: 'confirm' }).focus()}>Delete</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                    trigger="click"
                >
                    {(t) => <button {...t()}>more</button>}
                </Dropdown>
                <button onClick={onConfirm}>confirm</button>
            </>
        ));
        screen.getByRole('button', { name: 'more' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Delete')).toHaveFocus());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('关闭状态的菜单按钮上，ArrowDown 与 ArrowUp 分别打开并聚焦第一项与最后一项', async () => {
        render(() => <HoverNested />);
        const button = screen.getByRole('button', { name: 'hover nested' });
        button.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(item('Omega')).toHaveFocus());
    });

    it('Escape 后，在关闭的悬停菜单按钮上按 ArrowDown 可重新打开菜单', async () => {
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>First</Dropdown.Item>
                        <Dropdown.Item>Last</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                {(t) => <button {...t()}>hover button</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'hover button' });
        button.focus();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(item('Last')).toHaveFocus());
    });

    it('通用触发器上按 ArrowDown 不会打开菜单', async () => {
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>One</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                <span>generic</span>
            </Dropdown>
        ));
        // the focusable element is Dropdown's own wrapping span
        screen.getByText('generic').closest<HTMLElement>('[tabindex]')?.focus();
        await userEvent.keyboard('{ArrowDown}');
        await sleep(200);
        expect(portals()).toHaveLength(0);
    });

    it('即使 closeOnEsc 为 false，ArrowLeft 仍会关闭子菜单', async () => {
        render(() => (
            <Dropdown
                closeOnEsc={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown
                            closeOnEsc={false}
                            position="rightTop"
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item>Deep</Dropdown.Item>
                                </Dropdown.Menu>
                            }
                        >
                            {(t) => <Dropdown.Item {...t()}>Parent</Dropdown.Item>}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                {(t) => <button {...t()}>no esc</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'no esc' }));
        await waitFor(() => expect(item('Parent')).toHaveFocus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Deep')).toHaveFocus());
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Parent')).toHaveFocus();
    });

    describe('顶层触发器上的 Enter', () => {
        const menu = () => (
            <Dropdown.Menu>
                <Dropdown.Item>Alpha</Dropdown.Item>
            </Dropdown.Menu>
        );

        // keydown already activates an a[href]: a second click() from the Dropdown would run onClick twice
        it('a[href] 触发器只激活一次', async () => {
            const onClick = vi.fn<(e: MouseEvent) => void>((e) => e.preventDefault());
            render(() => (
                <Dropdown render={menu()} trigger="click">
                    {(t) => (
                        <a href="#dropdown-anchor" onClick={onClick} {...t()}>
                            link trigger
                        </a>
                    )}
                </Dropdown>
            ));
            screen.getByText('link trigger').focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Alpha')).toBeVisible());
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('Avatar 触发器的 onClick 只运行一次，并打开菜单', async () => {
            const onClick = vi.fn<Callback>();
            render(() => (
                <Dropdown render={menu()} trigger="click">
                    {(t) => (
                        <Avatar onClick={onClick} {...t()}>
                            AB
                        </Avatar>
                    )}
                </Dropdown>
            ));
            screen.getByRole('button', { name: 'AB' }).focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Alpha')).toBeVisible());
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        // as when the trigger opens a Modal: the Enter that clicked the trigger must not also press the dialog's button
        it('不会按下触发器点击后焦点所在的按钮', async () => {
            const onConfirm = vi.fn<Callback>();
            render(() => (
                <>
                    <Dropdown render={menu()} trigger="custom" visible={false}>
                        {(t) => (
                            <div role="button" tabIndex={0} onClick={() => screen.getByRole('button', { name: 'confirm' }).focus()} {...t()}>
                                custom trigger
                            </div>
                        )}
                    </Dropdown>
                    <button onClick={onConfirm}>confirm</button>
                </>
            ));
            screen.getByText('custom trigger').focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
            expect(onConfirm).not.toHaveBeenCalled();
        });
    });

    it('loading Button 触发器的菜单打开后，ArrowDown 聚焦第一项', async () => {
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Loading first</Dropdown.Item>
                        <Dropdown.Item>Loading last</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                {(t) => (
                    <Button loading {...t()}>
                        loading trigger
                    </Button>
                )}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: /loading trigger/ });
        // the button ignores the pointer, so the wrapper takes the click
        await userEvent.click(button.parentElement as HTMLElement);
        await waitFor(() => expect(item('Loading first')).toHaveFocus());
        expect(button).toHaveAttribute('aria-expanded', 'true');
        button.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Loading first')).toHaveFocus());
    });

    it('未能打开菜单的 ArrowDown 不会让之后的悬停打开抢走焦点', async () => {
        render(() => (
            <>
                <Dropdown
                    disableFocusListener
                    render={
                        <Dropdown.Menu>
                            <Dropdown.Item>Hover only</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                >
                    {(t) => <button {...t()}>hover no focus</button>}
                </Dropdown>
                <input aria-label="elsewhere" />
            </>
        ));
        const button = screen.getByRole('button', { name: 'hover no focus' });
        button.focus();
        await userEvent.keyboard('{ArrowDown}');
        await sleep(200);
        expect(portals()).toHaveLength(0);
        const input = screen.getByRole('textbox', { name: 'elsewhere' });
        input.focus();
        await userEvent.hover(button);
        await waitFor(() => expect(item('Hover only')).toBeVisible());
        await sleep(100);
        expect(input).toHaveFocus();
    });

    it('render 里有可聚焦内容时，触发器上的 ArrowDown 只移动一次焦点', async () => {
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <li role="none">
                            <button>inside</button>
                        </li>
                        <Dropdown.Item>Focus first</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                {(t) => <button {...t()}>focus count</button>}
            </Dropdown>
        ));
        const trigger = screen.getByRole('button', { name: 'focus count' });
        await userEvent.click(trigger);
        await waitFor(() => expect(item('Focus first')).toHaveFocus());
        trigger.focus();
        let moves = 0;
        const count = () => moves++;
        document.addEventListener('focusin', count);
        try {
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Focus first')).toHaveFocus();
            expect(moves).toBe(1);
        } finally {
            document.removeEventListener('focusin', count);
        }
    });

    it('render 里没有菜单项时，触发器上的 ArrowDown 与 ArrowUp 聚焦弹层中第一个和最后一个可聚焦元素', async () => {
        render(() => (
            <Dropdown
                render={
                    <div>
                        <button>panel first</button>
                        <button>panel last</button>
                    </div>
                }
                trigger="click"
            >
                {(t) => <button {...t()}>panel trigger</button>}
            </Dropdown>
        ));
        const trigger = screen.getByRole('button', { name: 'panel trigger' });
        await userEvent.click(trigger);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        trigger.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('button', { name: 'panel first' })).toHaveFocus();
        trigger.focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(screen.getByRole('button', { name: 'panel last' })).toHaveFocus();
    });

    it('鼠标悬停 Button 触发器打开菜单后 aria-expanded 为 true，移开后恢复 false', async () => {
        render(() => (
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Alpha</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                {(t) => <Button {...t()}>hover trigger</Button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'hover trigger' });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        await userEvent.hover(button);
        await waitFor(() => expect(item('Alpha')).toBeVisible());
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.unhover(button);
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button).toHaveAttribute('aria-expanded', 'false');
    });
});
