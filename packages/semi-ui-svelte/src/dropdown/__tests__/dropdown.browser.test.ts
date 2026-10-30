import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { tab } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import DisabledButton from './disabled-button.svelte';
import DropdownCase from './dropdown-case.svelte';
import NestedCase from './nested-case.svelte';

type Store = NonNullable<Parameters<typeof DropdownCase>[1]>['store'];
type NestedStore = NonNullable<Parameters<typeof NestedCase>[1]>['store'];
type Entry = [label: string, props?: Record<string, unknown>];

const item = (name: string) => screen.getByText(name, { selector: '[role="menuitem"]' });
const portals = () => document.querySelectorAll('.semi-dropdown-wrapper');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const labels = (...names: string[]): Entry[] => names.map((name) => [name]);

function setup(props: Parameters<typeof DropdownCase>[1]['props'] = {}, init: Partial<Store> = {}) {
    const store = createStore<Store>({ accept: true, log: [], trigger: 'button', content: 'items', entries: labels('Alpha', 'Beta', 'Cherry'), menu: [], icons: false, ...init });
    render(DropdownCase, { props: { store, props: { trigger: 'click', ...props } } });
    flushSync();
    return { store, button: () => screen.getByRole('button', { name: 'trigger' }) };
}

function setupNested(init: Partial<NestedStore> = {}) {
    const store = createStore<NestedStore>({ log: [], open: false, outerTrigger: 'click', innerTrigger: 'hover', outerTick: false, innerTick: false, closeOnEsc: true, ...init });
    render(NestedCase, { props: { store } });
    return { store, button: () => screen.getByRole('button', { name: 'outer trigger' }) };
}

describe('Svelte Dropdown 键盘操作（浏览器）', () => {
    it('hover 触发：悬停打开并带 aria-expanded，移开后关闭', async () => {
        const { button } = setup({ trigger: 'hover' });
        expect(button()).toHaveAttribute('aria-expanded', 'false');
        await userEvent.hover(button());
        await waitFor(() => expect(item('Alpha')).toBeVisible());
        await waitFor(() => expect(button()).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.unhover(button());
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button()).toHaveAttribute('aria-expanded', 'false');
    });

    it('方向键在可用选项间循环，Home 与 End 跳到首尾，字母跳转，Enter 触发点击', async () => {
        const clicks: string[] = [];
        const { button } = setup({}, { entries: [['Apple'], ['Banana', { disabled: true }], ['Cherry', { onclick: () => clicks.push('Cherry') }]] });
        await userEvent.click(button());
        await waitFor(() => expect(item('Apple')).toHaveFocus());
        expect(item('Apple')).toHaveAttribute('tabindex', '0');
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Cherry')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Apple')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(item('Cherry')).toHaveFocus();
        await userEvent.keyboard('ap');
        expect(item('Apple')).toHaveFocus();
        await userEvent.keyboard('{End}');
        expect(item('Cherry')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(item('Apple')).toHaveFocus();
        await userEvent.keyboard('{End}{Enter}');
        expect(clicks).toEqual(['Cherry']);
    });

    it('Escape 关闭弹层、上报 escKeyDown，并把焦点还给触发器；closeOnEsc 为 false 时不关闭', async () => {
        const { store, button } = setup();
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(store.log).toContain('esc true');
        expect(button()).toHaveFocus();
    });

    it('hover 触发且延迟为 0 时，ArrowDown 把焦点从触发器移入菜单，Escape 关闭弹层并把焦点还给触发器，不重新打开', async () => {
        const { button } = setup({ trigger: 'hover' });
        button().focus();
        await waitFor(() => expect(button()).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        // a popup that closed behind the focus move would drop it here
        await sleep(100);
        expect(item('Alpha')).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button()).toHaveFocus();
        await sleep(100);
        expect(portals()).toHaveLength(0);
        expect(button()).toHaveFocus();
    });

    it('closeOnEsc 为 false 时 Escape 不关闭弹层', async () => {
        const { button } = setup({ closeOnEsc: false });
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await sleep(100);
        expect(portals()).toHaveLength(1);
    });

    it('关闭状态的菜单按钮上，ArrowDown 与 ArrowUp 分别打开并聚焦第一项与最后一项', async () => {
        const { button } = setup();
        button().focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button()).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(item('Cherry')).toHaveFocus());
    });

    it('通用触发器上按 ArrowDown 不会打开菜单', async () => {
        setup({}, { trigger: 'plain' });
        screen.getByText('plain trigger').focus();
        await userEvent.keyboard('{ArrowDown}');
        await sleep(200);
        expect(portals()).toHaveLength(0);
    });

    it.each(['{Enter}', ' '])('在 %j 上对原生按钮触发器只点击一次，并聚焦第一项', async (key) => {
        const { button } = setup();
        let clicks = 0;
        button().addEventListener('click', () => (clicks += 1));
        button().focus();
        await userEvent.keyboard(key);
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        expect(clicks).toBe(1);
    });

    it('文本触发器按 Enter 打开菜单并聚焦第一项，ArrowUp 移到末项', async () => {
        setup({}, { trigger: 'text' });
        screen.getByText('text trigger').focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        screen.getByText('text trigger').focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(item('Cherry')).toHaveFocus();
    });

    it('自己处理 Enter 的触发器只激活一次并打开菜单', async () => {
        const { store } = setup({}, { trigger: 'self-click' });
        screen.getByText('self click').focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(item('Alpha')).toBeVisible());
        expect(store.log.filter((entry) => entry === 'trigger click')).toHaveLength(1);
    });

    it('弹层里没有菜单项时，触发器上的 ArrowDown 与 ArrowUp 聚焦弹层中第一个和最后一个可聚焦元素', async () => {
        const { button } = setup({}, { content: 'panel' });
        await userEvent.click(button());
        await waitFor(() => expect(button()).toHaveAttribute('aria-expanded', 'true'));
        button().focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(screen.getByRole('button', { name: 'panel first' })).toHaveFocus();
        button().focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(screen.getByRole('button', { name: 'panel last' })).toHaveFocus();
    });

    it('文本输入框中的空格不触发菜单', async () => {
        setup({}, { trigger: 'text' });
        const input = document.createElement('input');
        input.setAttribute('aria-label', 'search');
        screen.getByText('text trigger').append(input);
        input.focus();
        await userEvent.keyboard('a b');
        expect(input).toHaveValue('a b');
        expect(portals()).toHaveLength(0);
    });
});

describe('Svelte Dropdown 禁用的 Button 触发器（浏览器）', () => {
    it.each(['hover', 'click'] as const)('%s 触发：真实指针落在禁用的 Button 上也能打开菜单', async (trigger) => {
        render(DisabledButton, { props: { props: { trigger } } });
        const button = screen.getByRole('button', { name: 'trigger' });
        if (trigger === 'hover') {
            await userEvent.hover(button, { force: true });
        } else {
            await userEvent.click(button, { force: true });
        }
        await waitFor(() => expect(item('Alpha')).toBeVisible());
    });
});

describe('Svelte Dropdown 子菜单键盘操作（浏览器）', () => {
    const openOuterAndFocusParent = async (button: () => HTMLElement) => {
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Parent')).toHaveFocus();
    };

    it('Right 打开子菜单并聚焦第一项，Left 关闭子菜单并聚焦父级选项', async () => {
        const { store, button } = setupNested({ innerTrigger: 'click' });
        await openOuterAndFocusParent(button);
        expect(item('Parent')).toHaveAttribute('aria-haspopup', 'menu');
        expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        expect(item('Parent')).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Inner two')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Inner one')).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(store.log.filter((entry) => entry === 'inner one')).toHaveLength(1);
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(portals()).toHaveLength(1));
        expect(item('Parent')).toHaveFocus();
        expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
    });

    it('在父级选项上按 Enter 打开子菜单并聚焦第一项；父级选项上的上下键留在父菜单内', async () => {
        const { button } = setupNested({ innerTrigger: 'click' });
        await openOuterAndFocusParent(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(item('Parent')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Omega')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(item('Parent')).toHaveFocus();
    });

    it('Escape 先关闭子菜单，再关闭包含父级选项的菜单并把焦点还给触发器', async () => {
        const { button } = setupNested({ innerTrigger: 'click' });
        await openOuterAndFocusParent(button);
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(1));
        expect(item('Parent')).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button()).toHaveFocus();
    });

    it.each(['{Escape}', '{ArrowLeft}'])('悬停子菜单被 %s 关闭后，父项上按 ArrowRight 再次打开', async (key) => {
        const { button } = setupNested();
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await userEvent.keyboard(key);
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Parent')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
    });

    it('悬停子菜单中按 Escape 只关闭子菜单，外层保持打开', async () => {
        const { button } = setupNested();
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Parent')).toHaveFocus();
        expect(button()).toHaveAttribute('aria-expanded', 'true');
    });

    it('Tab 关闭所有菜单并让焦点继续往后移，而非返回触发器', async () => {
        const { button } = setupNested();
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await tab();
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button()).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('在已打开菜单的触发器上按 Tab 会关闭菜单，之后可再次打开', async () => {
        const { button } = setupNested({ outerTrigger: 'click' });
        await userEvent.click(button());
        await waitFor(() => expect(button()).toHaveAttribute('aria-expanded', 'true'));
        button().focus();
        await tab();
        await waitFor(() => expect(portals()).toHaveLength(0));
        expect(button()).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(button());
        await waitFor(() => expect(button()).toHaveAttribute('aria-expanded', 'true'));
    });

    it('通过聚焦触发器打开的悬停菜单，在焦点进入悬停子菜单期间保持打开', async () => {
        const { button } = setupNested({ outerTrigger: 'hover' });
        button().focus();
        await waitFor(() => expect(button()).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Alpha')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await sleep(300);
        expect(item('Inner one')).toHaveFocus();
        expect(button()).toHaveAttribute('aria-expanded', 'true');
        expect(portals()).toHaveLength(2);
    });

    it('即使 closeOnEsc 为 false，ArrowLeft 仍会关闭子菜单', async () => {
        const { button } = setupNested({ closeOnEsc: false, innerTrigger: 'click' });
        await userEvent.click(button());
        await waitFor(() => expect(item('Alpha')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(item('Parent')).toHaveAttribute('aria-expanded', 'false'));
        expect(item('Parent')).toHaveFocus();
    });

    it('RTL 下 Left 打开子菜单，Right 关闭', async () => {
        const { button } = setupNested({ direction: 'rtl', innerTrigger: 'click' });
        await openOuterAndFocusParent(button);
        await userEvent.keyboard('{ArrowRight}');
        expect(portals()).toHaveLength(1);
        expect(item('Parent')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(item('Inner one')).toHaveFocus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(portals()).toHaveLength(1));
        expect(item('Parent')).toHaveFocus();
    });
});
