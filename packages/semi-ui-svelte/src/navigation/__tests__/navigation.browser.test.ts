import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { NavProps } from '../interface';
import NavChildren from './nav-children.svelte';
import NavFixture from './nav-fixture.svelte';

type Store = { props: NavProps; snippets: boolean; wrap: boolean };

const prefix = 'semi-navigation';
const items = [
    { itemKey: 'home', text: '首页' },
    {
        itemKey: 'user',
        text: '用户',
        items: [
            { itemKey: 'list', text: '用户列表' },
            { itemKey: 'ban', text: '用户封禁' },
        ],
    },
    { itemKey: 'job', text: '任务', items: [{ itemKey: 'query', text: '任务查询' }] },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const menus = () => document.querySelectorAll('[role="menu"]');
// the label sits in a nested span of the menuitem, so match on the item's own text
const popupItem = (name: string) => screen.getByRole('menuitem', { name });
const sub = (name: string) => screen.getByRole('button', { name });
const selected = () => [...document.querySelectorAll(`.${prefix}-item-selected`)].map((el) => el.textContent?.trim());

function setup(props: NavProps = {}, init: Partial<Store> = {}) {
    const store = createStore<Store>({ props: { items, ...props }, snippets: false, wrap: false, ...init });
    const view = render(NavFixture, { props: { store } });
    flushSync();
    return { store, nav: view.container.querySelector(`.${prefix}`) as HTMLElement };
}

describe('Svelte Navigation 键盘与焦点（浏览器）', () => {
    it('Tab 依次到达每个可见的项与子菜单标题，不到达其他元素', async () => {
        const { nav } = setup({ openKeys: ['user'] });
        const stops = [screen.getByRole('button', { name: '首页' }), sub('用户'), screen.getByRole('button', { name: '用户列表' }), screen.getByRole('button', { name: '用户封禁' }), sub('任务')];
        for (const stop of stops) {
            await tabTo(stop);
        }
        const focusable = [...nav.querySelectorAll<HTMLElement>('a[href], button, [tabindex]')].filter((el) => el.tabIndex >= 0);
        expect(focusable).toEqual(stops);
    });

    it('在子菜单标题上按 Enter 与 Space 展开和收起，aria-expanded 同步', async () => {
        setup();
        const user = sub('用户');
        expect(user).toHaveAttribute('aria-expanded', 'false');
        user.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(user).toHaveAttribute('aria-expanded', 'true'));
        await screen.findByText('用户列表');
        expect(user).toHaveFocus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(user).toHaveAttribute('aria-expanded', 'false'));
        await waitFor(() => expect(screen.queryByText('用户列表')).toBeNull());
        expect(user).toHaveFocus();
    });

    it('在项上按 Enter 与 Space 各选中一次', async () => {
        const selects: string[] = [];
        setup({ openKeys: ['user'], onSelect: (data) => selects.push(String(data.itemKey)) });
        const list = screen.getByRole('button', { name: '用户列表' });
        list.focus();
        await userEvent.keyboard('{Enter}');
        expect(selects).toEqual(['list']);
        expect(selected()).toEqual(['用户列表']);
        screen.getByRole('button', { name: '用户封禁' }).focus();
        await userEvent.keyboard(' ');
        expect(selects).toEqual(['list', 'ban']);
        expect(selected()).toEqual(['用户封禁']);
        expect(screen.getByRole('button', { name: '用户封禁' })).toHaveAttribute('aria-current', 'page');
    });

    it('在项、链接和子标题上显示主题焦点环', async () => {
        render(NavChildren, { props: { props: { openKeys: ['user'] }, header: false } });
        flushSync();
        for (const el of [screen.getByRole('button', { name: '首页' }), screen.getByRole('button', { name: '用户' }), screen.getByRole('button', { name: '用户列表' }), screen.getByRole('link', { name: '文档' })]) {
            await tabTo(el);
            expectThemeFocusRing(el);
        }
    });

    it('悬停项内的按钮时，其 li 应用悬停样式', async () => {
        setup();
        const button = screen.getByRole('button', { name: '首页' });
        const li = button.closest('li') as HTMLElement;
        const probe = document.createElement('span');
        probe.style.backgroundColor = 'var(--semi-color-fill-0)';
        li.append(probe);
        const hoverColor = getComputedStyle(probe).backgroundColor;
        probe.remove();
        expect(getComputedStyle(li).backgroundColor).not.toBe(hoverColor);
        await userEvent.hover(button);
        await waitFor(() => expect(getComputedStyle(li).backgroundColor).toBe(hoverColor));
    });

    it('原生 button 上的项布局与 li 上完全一致', () => {
        setup({
            items: [
                { itemKey: 'home', text: '首页' },
                { itemKey: 'about', text: '关于', disabled: true },
            ],
        });
        const button = screen.getByRole('button', { name: '首页' });
        const li = button.closest('li') as HTMLElement;
        expect(button.getBoundingClientRect().toJSON()).toEqual(li.getBoundingClientRect().toJSON());
        const text = screen.getByText('首页').getBoundingClientRect();
        expect(text.left - li.getBoundingClientRect().left).toBe(12);
        expect(text.top - li.getBoundingClientRect().top).toBe(8);
        const disabled = screen.getByRole('button', { name: '关于' });
        expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
    });
});

describe('Svelte Navigation 折叠态与弹出子菜单（浏览器）', () => {
    it('折叠态下顶层项仍可聚焦，聚焦与悬停时 Tooltip 显示项文字', async () => {
        setup({ isCollapsed: true }, { snippets: true });
        const home = screen.getByRole('button', { name: /首页/ });
        await tabTo(home);
        const tip = await screen.findByRole('tooltip');
        expect(tip).toHaveTextContent('首页!');
        expect(home).toHaveAttribute('aria-describedby', tip.id);
        expect(home).toHaveFocus();
    });

    it('折叠态下点击子菜单标题弹出菜单，方向键进入后 Enter 选中一次，弹层保持打开直到 Escape', async () => {
        const selects: string[] = [];
        setup({ isCollapsed: true, onSelect: (data) => selects.push(String(data.itemKey)) }, { snippets: true });
        const user = sub('用户!');
        expect(user).toHaveAttribute('aria-haspopup', 'menu');
        await userEvent.click(user);
        await waitFor(() => expect(menus()).toHaveLength(1));
        // a pointer opens the popup without moving focus; the arrow keys enter the menu
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(popupItem('用户列表!')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}');
        expect(popupItem('用户封禁!')).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(selects).toEqual(['ban']);
        expect(selected()).toEqual(['用户封禁!']);
        expect(menus()).toHaveLength(1);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menus()).toHaveLength(0));
        expect(user).toHaveFocus();
    });

    it('折叠态下 Escape 关闭弹出子菜单并把焦点还给标题', async () => {
        setup({ isCollapsed: true }, { snippets: true });
        const user = sub('用户!');
        await tabTo(sub('首页!'));
        await tabTo(user);
        await waitFor(() => expect(user).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(popupItem('用户列表!')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menus()).toHaveLength(0));
        expect(user).toHaveFocus();
    });

    it('折叠态下悬停标题打开弹出子菜单，移开后关闭', async () => {
        setup({ isCollapsed: true, subNavOpenDelay: 0, subNavCloseDelay: 0 }, { snippets: true });
        await userEvent.hover(sub('用户!'));
        await waitFor(() => expect(popupItem('用户列表!')).toBeVisible());
        await userEvent.unhover(sub('用户!'));
        await waitFor(() => expect(menus()).toHaveLength(0));
    });

    it('水平导航里子菜单以弹层展开，Escape 关闭弹层并把焦点还给标题', async () => {
        setup({ mode: 'horizontal' });
        const user = sub('用户');
        await tabTo(user);
        await waitFor(() => expect(user).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(popupItem('用户列表')).toHaveFocus());
        expect(screen.queryByRole('button', { name: '用户列表' })).toBeNull();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menus()).toHaveLength(0));
        expect(user).toHaveFocus();
    });

    it.each([
        ['水平导航', { mode: 'horizontal' }, { snippets: false }, '用户', '用户列表'],
        ['折叠态', { isCollapsed: true }, { snippets: true }, '用户!', '用户列表!'],
    ] as const)('%s下 subNavOpenDelay 与 subNavCloseDelay 为 0 时，方向键进入弹出子菜单，Escape 关闭后焦点回到标题', async (_name, props, init, title, entry) => {
        setup({ ...props, subNavOpenDelay: 0, subNavCloseDelay: 0 }, init);
        const user = sub(title);
        await tabTo(user);
        await waitFor(() => expect(user).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(popupItem(entry)).toHaveFocus());
        // a popup that closed behind the focus move would drop it here
        await sleep(100);
        expect(popupItem(entry)).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(menus()).toHaveLength(0));
        expect(user).toHaveFocus();
    });

    it('折叠按钮切换后焦点保持在按钮上，子菜单标题在折叠与展开间保持焦点', async () => {
        setup({ footer: { collapseButton: true }, openKeys: ['user'] }, { snippets: true });
        const toggle = () => document.querySelector<HTMLButtonElement>(`.${prefix}-collapse-btn button`) as HTMLButtonElement;
        toggle().focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.querySelector(`.${prefix}`)).toHaveClass(`${prefix}-collapsed`));
        expect(toggle()).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(document.querySelector(`.${prefix}`)).not.toHaveClass(`${prefix}-collapsed`));
        expect(toggle()).toHaveFocus();
        await sleep(50);
        const user = sub('用户!');
        user.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(user).toHaveAttribute('aria-expanded', 'false'));
        expect(user).toHaveFocus();
    });

    it('折叠与展开时文字淡入只发生在宽度动画期间', async () => {
        const { nav } = setup({ footer: { collapseButton: true } });
        expect(nav).not.toHaveClass(`${prefix}-collapse-animating`);
        const toggle = nav.querySelector<HTMLButtonElement>(`.${prefix}-collapse-btn button`) as HTMLButtonElement;
        await userEvent.click(toggle);
        await waitFor(() => expect(nav).toHaveClass(`${prefix}-collapsed`));
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
    });
});
