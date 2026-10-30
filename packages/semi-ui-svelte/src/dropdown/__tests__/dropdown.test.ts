import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { Dropdown, type DropdownProps, type DropDownMenuItem } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import DisabledParent from './disabled-parent.svelte';
import DropdownCase from './dropdown-case.svelte';
import MenuCase from './menu-case.svelte';
import NestedCase from './nested-case.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
type Entry = [label: string, props?: Record<string, unknown>];
type Store = NonNullable<Parameters<typeof DropdownCase>[1]>['store'];
type NestedStore = NonNullable<Parameters<typeof NestedCase>[1]>['store'];

const defaultEntries: Entry[] = ['Menu Item 1', 'Menu Item 2', 'Menu Item 3'].map((label) => [label]);

const popup = () => document.querySelector<HTMLElement>('.semi-dropdown-wrapper');
const portals = () => document.querySelectorAll('.semi-dropdown-wrapper');
const item = (name: string) => screen.getByText(name, { selector: '[role^="menuitem"]' });
const trigger = () => screen.getByText(/trigger|self click/);

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(props: Omit<DropdownProps, 'visible' | 'children' | 'child' | 'content' | 'menuIcon' | 'menu'> = {}, { mode = 'uncontrolled' as Mode, ...init }: Partial<Store> & { mode?: Mode } = {}) {
    const store = createStore<Store>({ accept: true, log: [], trigger: 'button', content: 'items', entries: defaultEntries, menu: [], icons: false, ...init });
    const result = render(DropdownCase, { props: { mode, store, props: { trigger: 'click', ...props } } });
    flushSync();
    const click = async (target: Element = trigger()) => {
        await fireEvent.mouseDown(target);
        await fireEvent.click(target);
        await settle();
    };
    return { store, click, api: () => result.component.api(), ...result };
}

function setupNested(init: Partial<NestedStore> = {}) {
    const store = createStore<NestedStore>({ log: [], open: true, outerTrigger: 'click', innerTrigger: 'click', outerTick: false, innerTick: false, closeOnEsc: true, ...init });
    const result = render(NestedCase, { props: { store } });
    return { store, ...result };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Dropdown 渲染', () => {
    it('class 落在弹层外壳，style 与 contentClassName 落在菜单容器，未声明的属性不落在任何节点', async () => {
        setup({ trigger: 'custom', class: 'test', style: 'color: red', contentClassName: 'content', 'data-extra': 'x', id: 'dropdown-id' } as DropdownProps, { mode: 'bind', value: true });
        await settle();
        expect(popup()).toHaveClass('semi-dropdown-wrapper', 'test');
        expect(document.querySelector('.semi-dropdown')).toHaveClass('content');
        expect(document.querySelector('.semi-dropdown')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.querySelector('[data-extra]')).toBeNull();
        expect(document.getElementById('dropdown-id')).toBeNull();
        expect(document.querySelector('.semi-dropdown-content')).toHaveAttribute('x-semi-prop', 'content');
    });

    it('menu 数据渲染标题、选项与分隔线，menuIcon 给数据项渲染图标', async () => {
        const menu: DropDownMenuItem[] = [
            { node: 'title', name: 'Group' },
            { node: 'item', name: 'A', active: true },
            { node: 'item', name: 'B', disabled: true },
            { node: 'divider', class: 'custom-divider', style: 'margin: 3px' },
            { node: 'item', name: 'C', type: 'danger' },
        ];
        setup({ trigger: 'custom' }, { mode: 'bind', value: true, content: 'data', menu, icons: true });
        const list = await screen.findByRole('menu');
        expect(list).toHaveClass('semi-dropdown-menu');
        expect(list).toHaveAttribute('aria-orientation', 'vertical');
        const title = document.querySelector('.semi-dropdown-title');
        expect(title).toHaveTextContent(/^Group$/);
        expect(title).toHaveAttribute('role', 'presentation');
        expect(title).not.toHaveClass('semi-dropdown-title-withTick');
        expect(screen.getByRole('separator')).toHaveClass('semi-dropdown-divider', 'custom-divider');
        expect(screen.getByRole('separator')).toHaveStyle({ margin: '3px' });
        expect([...list.children].map((child) => child.tagName)).toEqual(['LI', 'LI', 'LI', 'LI', 'LI']);
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(item('A')).toHaveClass('semi-dropdown-item-active');
        expect(item('A')).toHaveAttribute('aria-disabled', 'false');
        expect(item('A')).toHaveAttribute('tabindex', '-1');
        expect(item('B')).toHaveClass('semi-dropdown-item-disabled');
        expect(item('B')).toHaveAttribute('aria-disabled', 'true');
        expect(item('C')).toHaveClass('semi-dropdown-item-danger');
        expect(item('C').querySelector('.semi-dropdown-item-icon')).toContainElement(screen.getByTestId('icon'));
    });

    it('menu 数据变化：同一项保留元素，换成其他项重新挂载', async () => {
        const { store } = setup({ trigger: 'custom' }, { mode: 'bind', value: true, content: 'data', menu: [{ node: 'item', name: 'first' }] });
        await settle();
        const first = item('first');
        store.menu = [{ node: 'item', name: 'first', active: true }];
        flushSync();
        expect(item('first')).toBe(first);
        store.menu = [{ node: 'item', name: 'second' }];
        flushSync();
        expect(item('second')).not.toBe(first);
    });

    it('content 优先于 menu，空 content 也替换 menu', async () => {
        const { store } = setup({ trigger: 'custom' }, { mode: 'bind', value: true, content: 'panel', menu: [{ node: 'item', name: 'from menu' }] });
        await settle();
        expect(screen.getByText('panel first')).toBeInTheDocument();
        expect(screen.queryByText('from menu')).toBeNull();
        store.content = 'empty';
        flushSync();
        expect(document.querySelector('.semi-dropdown-content')?.textContent?.trim()).toBe('');
    });

    it('showTick 标记标题并给每个选项加勾选，勾选不计入名称，仅激活项可见', async () => {
        setup(
            { trigger: 'custom', showTick: true },
            {
                mode: 'bind',
                value: true,
                content: 'data',
                menu: [
                    { node: 'title', name: 'Tick group' },
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ],
            }
        );
        await settle();
        expect(document.querySelector('.semi-dropdown-title')).toHaveClass('semi-dropdown-title-withTick');
        expect(screen.getByRole('menuitemcheckbox', { name: 'on' })).toHaveClass('semi-dropdown-item-withTick');
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
        expect(item('on').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('');
        expect(item('off').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('transparent');
    });

    it.each([
        [{ selectionMode: 'single' }, 'menuitemradio', true],
        [{ selectionMode: 'multiple' }, 'menuitemcheckbox', true],
        [{}, 'menuitem', false],
    ] as const)('selectionMode %j 的选项 role 是 %s，aria-checked 为 %s', async (props, role, checked) => {
        setup({ trigger: 'custom', ...props }, { mode: 'bind', value: true, content: 'data', menu: [{ node: 'item', name: 'on', active: true }] });
        await settle();
        expect(item('on')).toHaveAttribute('role', role);
        expect(item('on').getAttribute('aria-checked')).toBe(checked ? 'true' : null);
        // only showTick draws a tick
        expect(item('on').querySelector('.semi-icon-tick')).toBeNull();
    });

    it('Item 自身的 showTick 只在 Dropdown 之外生效', async () => {
        setup({ trigger: 'custom' }, { mode: 'bind', value: true, entries: [['inside', { showTick: true }]] });
        render(MenuCase, { props: { standalone: true } });
        await settle();
        expect(item('inside')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('outside').querySelector('.semi-icon-tick')).not.toBeNull();
    });

    it('Menu、Title 与 Divider 把未声明属性落到各自元素，Menu 的 role 与 aria-orientation 可被覆盖', () => {
        const { container } = render(MenuCase, { props: { attrs: { 'data-testid': 'menu-attr', role: 'group', 'aria-orientation': 'horizontal', 'aria-label': 'own menu' } } });
        expect(screen.getByTestId('menu-attr')).toBe(screen.getByRole('group', { name: 'own menu' }));
        expect(screen.getByRole('group')).toHaveAttribute('aria-orientation', 'horizontal');
        expect(screen.getByRole('group')).toHaveClass('semi-dropdown-menu');
        const title = screen.getByTestId('title-attr');
        expect(title).toHaveAttribute('id', 'title-id');
        expect(title).toHaveClass('semi-dropdown-title');
        expect(screen.getByRole('separator')).toHaveAttribute('data-testid', 'divider-attr');
        expect(container.querySelectorAll('li')).toHaveLength(4);
    });
});

describe('Svelte Dropdown 点击与 Item 事件', () => {
    it('click 触发：点击打开，外部点击关闭并上报 clickOutSide，弹层移除后通知一次 afterClose', async () => {
        const { store, click } = setup();
        expect(popup()).toBeNull();
        await click();
        expect(document.querySelectorAll('.semi-dropdown-item')).toHaveLength(3);
        expect(popup()).toHaveClass('semi-dropdown-wrapper-show');
        await click(screen.getByText('outside'));
        expect(popup()).toBeNull();
        expect(store.log).toEqual(['change true', 'afterOpen', 'outside true', 'change false', 'afterClose']);
    });

    it('clickToHide 在点击选项后关闭弹层，关掉后点击选项保持打开', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { click, store } = setup({ clickToHide: true }, { entries: [['hide item', { onclick }]] });
        await click();
        await click(item('hide item'));
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(popup()).toBeNull();
        expect(store.log.at(-2)).toBe('change false');
    });

    it('Item 的 onclick 收到原生点击事件；disabled 项不调用 mouseenter、mouseleave、contextmenu、click 与 onclickcapture，仍调用 mousedown', async () => {
        const listeners = {
            onclick: vi.fn<(event: MouseEvent) => void>(),
            onclickcapture: vi.fn<(event: MouseEvent) => void>(),
            onmouseenter: vi.fn<(event: MouseEvent) => void>(),
            onmouseleave: vi.fn<(event: MouseEvent) => void>(),
            oncontextmenu: vi.fn<(event: MouseEvent) => void>(),
            onmousedown: vi.fn<(event: MouseEvent) => void>(),
        };
        const onclick = vi.fn<(event: MouseEvent) => void>();
        setup(
            { trigger: 'custom' },
            {
                mode: 'bind',
                value: true,
                entries: [
                    ['Item 1', { disabled: true, ...listeners }],
                    ['Item 2', { class: 'test', onclick }],
                ],
            }
        );
        await settle();
        const disabled = item('Item 1');
        await fireEvent.mouseEnter(disabled);
        await fireEvent.mouseLeave(disabled);
        await fireEvent.contextMenu(disabled);
        await fireEvent.mouseDown(disabled);
        await fireEvent.click(disabled);
        expect(listeners.onmouseenter).not.toHaveBeenCalled();
        expect(listeners.onmouseleave).not.toHaveBeenCalled();
        expect(listeners.oncontextmenu).not.toHaveBeenCalled();
        expect(listeners.onclick).not.toHaveBeenCalled();
        expect(listeners.onclickcapture).not.toHaveBeenCalled();
        expect(listeners.onmousedown).toHaveBeenCalledTimes(1);
        const enabled = item('Item 2');
        await fireEvent.click(enabled);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onclick.mock.calls[0][0].target).toBe(enabled);
        expect(enabled).toHaveClass('semi-dropdown-item', 'test');
    });

    it('stopPropagation 阻止弹层点击冒泡到 document', async () => {
        const outer = vi.fn<() => void>();
        setup({ trigger: 'custom', stopPropagation: true }, { mode: 'bind', value: true });
        await settle();
        // Svelte registers its delegated listener on mount; a document listener added earlier would still see the click
        document.addEventListener('click', outer);
        try {
            await fireEvent.click(item('Menu Item 1'));
            expect(outer).not.toHaveBeenCalled();
        } finally {
            document.removeEventListener('click', outer);
        }
    });
});

describe('Svelte Dropdown 触发器语义', () => {
    it('button 触发器带 aria-haspopup、aria-expanded 与显示类名', async () => {
        const { click } = setup();
        expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        expect(trigger()).not.toHaveClass('semi-dropdown-showing');
        await click();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(trigger()).toHaveClass('semi-dropdown-showing');
        expect(trigger()).not.toHaveAttribute('aria-describedby');
    });

    it('通用触发器不带 aria-haspopup 与 aria-expanded，带 menuitem 角色的元素带', async () => {
        const plain = setup({}, { trigger: 'plain' });
        await plain.click();
        expect(trigger()).not.toHaveAttribute('aria-haspopup');
        expect(trigger()).not.toHaveAttribute('aria-expanded');
        expect(trigger()).toHaveClass('semi-dropdown-showing');
        plain.unmount();
        setup({}, { trigger: 'role' });
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('文本触发器包在带 data-popupid 与 tabindex 的 span 里，不带 aria-haspopup，保持行内', () => {
        setup({ wrapperClassName: 'own-wrapper' }, { trigger: 'text' });
        const span = screen.getByText('text trigger');
        expect(span.tagName).toBe('SPAN');
        expect(span).toHaveClass('semi-tooltip-trigger-wrapper', 'own-wrapper');
        expect(span).toHaveAttribute('tabindex', '0');
        expect(span.dataset.popupid).toMatch(/^semi-tooltip-/);
        expect(span).not.toHaveAttribute('aria-haspopup');
        expect(span.style.display).toBe('');
    });

    it('弹层容器不是 tooltip 角色', async () => {
        setup({ trigger: 'custom' }, { mode: 'bind', value: true });
        await settle();
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(screen.getByRole('menu').closest('[role="tooltip"]')).toBeNull();
        expect(popup()).toHaveAttribute('role', 'presentation');
    });

    it('触发器自己 Enter 点击并 preventDefault 时只点击一次，并打开菜单', async () => {
        const { store } = setup({}, { trigger: 'self-click' });
        trigger().focus();
        await fireEvent.keyDown(trigger(), { key: 'Enter' });
        await settle();
        expect(store.log.filter((entry) => entry === 'trigger click')).toHaveLength(1);
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('触发器上的 ArrowDown 与 ArrowUp 聚焦第一个和最后一个可用选项，仅在打开时阻止默认行为', async () => {
        const { store } = setup({ trigger: 'custom' }, { mode: 'bind', value: false, entries: [['First'], ['Middle'], ['Last disabled', { disabled: true }]] });
        const keyDown = (key: string) => trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        expect(keyDown('ArrowDown')).toBe(true);
        store.value = true;
        await settle();
        expect(keyDown('ArrowDown')).toBe(false);
        expect(item('First')).toHaveFocus();
        expect(keyDown('ArrowUp')).toBe(false);
        expect(item('Middle')).toHaveFocus();
    });
});

describe('Svelte Dropdown 受控 visible', () => {
    it('bind:visible：交互写回父级，父级改值开合，每次变化只通知一次', async () => {
        const { store, click } = setup({}, { mode: 'bind', value: false });
        await click();
        expect(store.value).toBe(true);
        expect(popup()).not.toBeNull();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        store.value = false;
        await settle();
        expect(popup()).toBeNull();
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        store.value = true;
        await settle();
        expect(popup()).not.toBeNull();
        await click(screen.getByText('outside'));
        expect(store.value).toBe(false);
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual(['change true', 'change false']);
    });

    it('函数绑定：setter 拒绝时菜单保持关闭，只通知请求；接受后打开', async () => {
        const { store, click } = setup({}, { mode: 'function', value: false, accept: false });
        await click();
        expect(popup()).toBeNull();
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        expect(store.log).toEqual(['set true', 'change true']);
        store.accept = true;
        await click();
        expect(store.value).toBe(true);
        expect(popup()).not.toBeNull();
    });

    it('单向 visible：只作初值，交互在本地覆盖，父级再推值时以父级为准', async () => {
        const { store, click } = setup({}, { mode: 'one-way', value: false });
        await click();
        expect(popup()).not.toBeNull();
        store.value = true;
        await settle();
        store.value = false;
        await settle();
        expect(popup()).toBeNull();
    });

    it('不传 visible：非受控，点击开合', async () => {
        const { click } = setup();
        await click();
        expect(popup()).not.toBeNull();
        await click(screen.getByText('outside'));
        expect(popup()).toBeNull();
    });

    it('受控 visible 的 contextMenu：Tab 与点击外部只上报关闭而不自行关闭，setter 接受后才关闭', async () => {
        const { store } = setup({ trigger: 'contextMenu' }, { mode: 'function', value: true, accept: false });
        await settle();
        trigger().focus();
        await fireEvent.keyDown(trigger(), { key: 'Tab' });
        await fireEvent.mouseDown(document.body);
        await settle();
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(store.log.filter((entry) => entry === 'change false')).toEqual(['change false', 'change false']);
        store.value = false;
        await settle();
        expect(popup()).toBeNull();
        expect(store.log.filter((entry) => entry === 'change false')).toHaveLength(2);
    });

    it('卸载打开中的菜单时同步通知一次 afterClose', async () => {
        const { store, unmount: remove } = setup({ trigger: 'custom' }, { mode: 'bind', value: true });
        await settle();
        remove();
        expect(store.log.filter((entry) => entry === 'afterClose')).toHaveLength(1);
    });
});

describe('Svelte Dropdown 嵌套', () => {
    it('触发子菜单的 Item 带 aria-haspopup 与 aria-expanded，tabindex 为 -1，不带 aria-describedby', async () => {
        setupNested();
        await settle();
        const parent = item('Parent');
        expect(parent).toHaveAttribute('aria-haspopup', 'menu');
        expect(parent).toHaveAttribute('aria-expanded', 'true');
        expect(parent).toHaveAttribute('tabindex', '-1');
        expect(parent).not.toHaveAttribute('aria-describedby');
        expect(parent).toHaveClass('semi-dropdown-showing');
        expect(item('Inner one')).toBeInTheDocument();
    });

    it('嵌套项在左键 mousedown 时发出 click，随后 detail 为 1 的 click 不再重复，键盘激活（detail 0）照常', async () => {
        const { store } = setupNested();
        await settle();
        await fireEvent.click(item('Inner one'), { detail: 1 });
        expect(store.log).toEqual([]);
        await fireEvent.mouseDown(item('Inner one'), { button: 2 });
        expect(store.log).toEqual(['inner mousedown']);
        await fireEvent.mouseDown(item('Inner one'), { button: 0 });
        expect(store.log).toEqual(['inner mousedown', 'inner mousedown', 'inner one']);
        await fireEvent.click(item('Inner one'), { detail: 0 });
        expect(store.log.filter((entry) => entry === 'inner one')).toHaveLength(2);
    });

    it('顶层项只在 click 时调用 onclick，mousedown 仍调用', async () => {
        const { store } = setupNested();
        await settle();
        await fireEvent.mouseDown(item('Parent'), { button: 0 });
        expect(store.log).toEqual(['parent mousedown']);
        await fireEvent.click(item('Parent'), { detail: 1 });
        expect(store.log).toEqual(['parent mousedown', 'parent click']);
    });

    it('Enter 与 Space 各点击一次子菜单选项，并阻止 Space 的默认行为', async () => {
        const { store } = setupNested();
        await settle();
        item('Inner one').focus();
        await fireEvent.keyDown(item('Inner one'), { key: 'Enter' });
        expect(store.log).toEqual(['inner one']);
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        item('Inner one').dispatchEvent(space);
        expect(space.defaultPrevented).toBe(true);
        expect(store.log).toEqual(['inner one', 'inner one']);
    });

    it('showTick 与 selectionMode 只作用于所在这一层，子菜单不继承 selectionMode', async () => {
        const { store } = setupNested({ outerTick: true, outerMode: 'single' });
        await settle();
        expect(item('Parent')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('Parent')).toHaveAttribute('role', 'menuitemradio');
        expect(item('Parent')).toHaveAttribute('aria-checked', 'true');
        expect(item('Inner one')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('Inner one')).toHaveAttribute('role', 'menuitem');
        store.outerTick = false;
        store.outerMode = undefined;
        store.innerTick = true;
        store.innerMode = 'multiple';
        await settle();
        expect(item('Parent')).toHaveAttribute('role', 'menuitem');
        expect(item('Inner one')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('Inner one')).toHaveClass('semi-dropdown-item-withTick');
    });

    it('未传 spacing 时顶层为 4、嵌套为 2', async () => {
        setupNested();
        await settle();
        const [outer, inner] = [...portals()] as HTMLElement[];
        expect(outer.style.top).toBe('4px');
        expect(inner.style.left).toBe('2px');
    });

    it('禁用的 Item 作子菜单父项时点击不打开子菜单', async () => {
        const view = render(DisabledParent);
        await settle();
        await fireEvent.click(screen.getByRole('menuitem', { name: 'Parent' }));
        await settle();
        expect(screen.queryByRole('menuitem', { name: 'Deep' })).toBeNull();
        view.unmount();
    });
});

describe('Svelte Dropdown 其他', () => {
    it('从 semiGlobal overrideDefaultProps 读取默认值，显式 prop 优先；wrapperId 不读全局值', async () => {
        semiGlobal.config = { overrideDefaultProps: { Dropdown: { trigger: 'custom', contentClassName: 'global-content', motion: false, role: 'group', wrapperId: 'popup-global' } as object } };
        const { store } = setup({ trigger: undefined }, { mode: 'bind', value: true });
        await settle();
        expect(document.querySelector('.semi-dropdown.global-content')).not.toBeNull();
        expect(popup()).toHaveAttribute('role', 'group');
        expect(document.getElementById('popup-global')).toBeNull();
        store.value = false;
    });

    it('未设置的 mouseEnterDelay 回落到 Tooltip 默认值 50ms', async () => {
        const store = createStore<Store>({ accept: true, log: [], trigger: 'button', content: 'items', entries: defaultEntries, menu: [], icons: false });
        render(DropdownCase, { props: { store, props: { trigger: 'hover', mouseEnterDelay: undefined } } });
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        try {
            await fireEvent.mouseEnter(trigger());
            await vi.advanceTimersByTimeAsync(49);
            expect(popup()).toBeNull();
            await vi.advanceTimersByTimeAsync(1);
            flushSync();
            expect(screen.getByRole('menu')).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it('ref 的 focusTrigger 聚焦触发器，rePosition 不抛错', async () => {
        const { api, click } = setup();
        api().focusTrigger();
        expect(trigger()).toHaveFocus();
        await click();
        expect(() => api().rePosition()).not.toThrow();
    });

    it('Menu：使用方 onkeydown 先于菜单处理执行', async () => {
        const seen: (string | null | undefined)[] = [];
        render(MenuCase, { props: { attrs: { onkeydown: () => seen.push(document.activeElement?.textContent?.trim()) } } });
        item('K1').focus();
        await fireEvent.keyDown(item('K1'), { key: 'ArrowDown' });
        expect(seen).toEqual(['K1']);
        expect(item('K2')).toHaveFocus();
    });

    it('卸载组件后不留弹层', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const component = mount(Dropdown, { target, props: { trigger: 'custom', visible: true, motion: false, content: createRawSnippet(() => ({ render: () => '<div>body</div>' })) } });
        await settle();
        expect(popup()).not.toBeNull();
        await unmount(component);
        expect(popup()).toBeNull();
        target.remove();
    });
});
