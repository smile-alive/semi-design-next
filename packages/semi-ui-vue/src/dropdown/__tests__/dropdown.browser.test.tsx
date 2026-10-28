/** @jsxImportSource vue */
import { type VNode } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tab } from '@test/utils/browser';
import { render, sleep } from '@test/utils/vue';
import Dropdown, { DropdownItem, DropdownMenu } from '..';
import Avatar from '../../avatar';
import Button from '../../button';
import Input from '../../input';
import Tag from '../../tag';
import AllHover from './fixtures/all-hover.vue';
import FocusElsewhere from './fixtures/focus-elsewhere.vue';
import HoverNested from './fixtures/hover-nested.vue';

const item = (name: string) => screen.getByText(name, { selector: '[role="menuitem"]' });
const portals = () => document.querySelectorAll('.semi-dropdown-wrapper');
const menuOf =
    (...labels: string[]) =>
    (): VNode => <DropdownMenu>{() => labels.map((label) => <DropdownItem>{() => label}</DropdownItem>)}</DropdownMenu>;

function renderDropdown(props: Record<string, unknown>, trigger: () => unknown, content: () => unknown) {
    return render(Dropdown, { props, slots: { default: trigger, content } });
}

describe('Dropdown 键盘操作（浏览器）', () => {
    it('ShadowRoot 内用键盘打开后焦点落在首项', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(Dropdown, {
            container: mount,
            props: { motion: false, trigger: 'click' },
            slots: { default: () => <button type="button">shadow trigger</button>, content: menuOf('Alpha', 'Beta') },
        });
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
        const onSubmit = vi.fn<(event: Event) => void>((event) => event.preventDefault());
        render(() => (
            <form onSubmit={onSubmit}>
                <Dropdown motion={false} trigger="click">
                    {{
                        default: () => <input aria-label="search" />,
                        content: menuOf('Alpha'),
                    }}
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
        const onClick = vi.fn<() => void>();
        renderDropdown(
            { trigger: 'click' },
            () => (
                <button type="button" onClick={onClick}>
                    native
                </button>
            ),
            menuOf('Alpha')
        );
        screen.getByRole('button', { name: 'native' }).focus();
        await userEvent.keyboard(key);
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('按 Enter 打开，进入悬停子菜单后再返回，并按 Escape 关闭', async () => {
        const view = render(HoverNested);
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
        expect(view.emitted('deep')).toHaveLength(1);
        await userEvent.keyboard('{Enter}');
        expect(view.emitted('deep')).toHaveLength(2);
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
        const view = render(AllHover);
        const button = screen.getByRole('button', { name: 'all hover' });
        button.focus();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Branch')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Leaf')).toHaveFocus());
        await sleep(300);
        expect(item('Leaf')).toHaveFocus();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Enter}');
        expect(view.emitted('leaf')).toHaveLength(1);
    });

    it('悬停子菜单中按 Escape 只关闭子菜单', async () => {
        render(HoverNested);
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
        render(HoverNested);
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
        render(HoverNested);
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
        render({
            render: () => (
                <>
                    <AllHover />
                    <button type="button">after</button>
                </>
            ),
        });
        const button = screen.getByRole('button', { name: 'all hover' });
        button.focus();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Branch')).toHaveFocus();
        await tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        await sleep(300);
        expect(portals()).toHaveLength(0);
        expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('在已打开菜单的触发器上按 Tab 会关闭菜单', async () => {
        render(HoverNested);
        const button = screen.getByRole('button', { name: 'hover nested' });
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        button.focus();
        await tab();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
    });

    // the close must not leave the popup pinned shut, as a `visible: false` passed to Tooltip would
    it('被 Tab 关闭的菜单可再次打开', async () => {
        render(Dropdown, {
            props: { menu: [{ node: 'item', name: 'Alpha' }], trigger: 'click' },
            slots: { default: () => <button type="button">click menu</button> },
        });
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
        const view = render(FocusElsewhere);
        screen.getByRole('button', { name: 'more' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Delete')).toHaveFocus());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
        expect(view.emitted('confirm')).toBeUndefined();
    });

    it('关闭状态的菜单按钮上，ArrowDown 与 ArrowUp 分别打开并聚焦第一项与最后一项', async () => {
        render(HoverNested);
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
        renderDropdown({}, () => <button type="button">hover button</button>, menuOf('First', 'Last'));
        const button = screen.getByRole('button', { name: 'hover button' });
        button.focus();
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(item('Last')).toHaveFocus());
    });

    it('通用触发器上按 ArrowDown 不会打开菜单', async () => {
        renderDropdown({ trigger: 'click' }, () => <span>generic</span>, menuOf('One'));
        screen.getByText('generic').focus();
        await userEvent.keyboard('{ArrowDown}');
        // a menu would have opened within one frame of the key press; 200ms covers a loaded machine
        await sleep(200);
        expect(portals()).toHaveLength(0);
    });

    it('即使 closeOnEsc 为 false，ArrowLeft 仍会关闭子菜单', async () => {
        render(AllHover, { props: { closeOnEsc: false, trigger: 'click' } });
        await userEvent.click(screen.getByRole('button', { name: 'all hover' }));
        await waitFor(() => expect(item('Branch')).toHaveFocus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Leaf')).toHaveFocus());
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(item('Branch')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Branch')).toHaveFocus();
    });

    it('文本触发器按 Enter 打开菜单并聚焦第一项，ArrowUp 移到末项', async () => {
        renderDropdown({ trigger: 'click' }, () => 'text trigger', menuOf('Text first', 'Text last'));
        screen.getByText('text trigger').focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(item('Text first')).toHaveFocus());
        screen.getByText('text trigger').focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(item('Text last')).toHaveFocus();
    });

    describe('顶层触发器上的 Enter', () => {
        // keydown already activates an a[href]: a second click() from the Dropdown would run its listener twice
        it('a[href] 触发器只激活一次', async () => {
            const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault());
            renderDropdown(
                { trigger: 'click' },
                () => (
                    <a href="#dropdown-anchor" onClick={onClick}>
                        link trigger
                    </a>
                ),
                menuOf('Alpha')
            );
            screen.getByText('link trigger').focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Alpha')).toBeVisible());
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('Tag 触发器的 @click 只运行一次，并打开菜单', async () => {
            const onClick = vi.fn<() => void>();
            renderDropdown({ trigger: 'click' }, () => <Tag onClick={onClick}>{() => 'tag trigger'}</Tag>, menuOf('Alpha'));
            screen.getByText('tag trigger').closest<HTMLElement>('[tabindex]')?.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Alpha')).toBeVisible());
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('Avatar 触发器的 @click 只运行一次，并打开菜单', async () => {
            const onClick = vi.fn<() => void>();
            renderDropdown({ trigger: 'click' }, () => <Avatar onClick={onClick}>{() => 'AB'}</Avatar>, menuOf('Alpha'));
            screen.getByRole('button', { name: 'AB' }).focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Alpha')).toBeVisible());
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        // as when the trigger opens a Modal: the Enter that clicked the trigger must not also press the dialog's button
        it('不会按下触发器点击后焦点所在的按钮', async () => {
            const view = render(FocusElsewhere, { props: { custom: true } });
            screen.getByText('custom trigger').focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(screen.getByRole('button', { name: 'confirm' })).toHaveFocus());
            expect(view.emitted('confirm')).toBeUndefined();
        });
    });

    // Tooltip wraps a loading Button in a span that carries the popup id, while focus and keydown stay on the button
    it('loading Button 触发器的菜单打开后，ArrowDown 聚焦第一项', async () => {
        renderDropdown({ trigger: 'click' }, () => <Button loading>{() => 'loading trigger'}</Button>, menuOf('Loading first', 'Loading last'));
        const button = screen.getByRole('button', { name: /loading trigger/ });
        await userEvent.click(button.parentElement as HTMLElement);
        await waitFor(() => expect(item('Loading first')).toHaveFocus());
        expect(button).toHaveAttribute('aria-expanded', 'true');
        button.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Loading first')).toHaveFocus());
    });

    it('未能打开菜单的 ArrowDown 不会让之后的悬停打开抢走焦点', async () => {
        renderDropdown({ disableFocusListener: true }, () => <button type="button">hover no focus</button>, menuOf('Hover only'));
        render(Input, { attrs: { 'aria-label': 'elsewhere' } });
        const button = screen.getByRole('button', { name: 'hover no focus' });
        button.focus();
        await userEvent.keyboard('{ArrowDown}');
        // a menu would have opened within one frame of the key press; 200ms covers a loaded machine
        await sleep(200);
        expect(portals()).toHaveLength(0);
        const elsewhere = screen.getByRole('textbox', { name: 'elsewhere' });
        elsewhere.focus();
        await userEvent.hover(button);
        await waitFor(() => expect(item('Hover only')).toBeVisible());
        await sleep(100);
        expect(elsewhere).toHaveFocus();
    });

    it('#content 里有可聚焦内容时，触发器上的 ArrowDown 只移动一次焦点', async () => {
        renderDropdown(
            { trigger: 'click' },
            () => <button type="button">focus count</button>,
            () => (
                <DropdownMenu>
                    {() => (
                        <>
                            <li role="none">
                                <button type="button">inside</button>
                            </li>
                            <DropdownItem>{() => 'Focus first'}</DropdownItem>
                        </>
                    )}
                </DropdownMenu>
            )
        );
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

    it('#content 里没有菜单项时，触发器上的 ArrowDown 与 ArrowUp 聚焦弹层中第一个和最后一个可聚焦元素', async () => {
        renderDropdown(
            { trigger: 'click' },
            () => <button type="button">panel trigger</button>,
            () => (
                <div>
                    <button type="button">panel first</button>
                    <button type="button">panel last</button>
                </div>
            )
        );
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
        renderDropdown({}, () => <Button>{() => 'hover trigger'}</Button>, menuOf('Alpha'));
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
