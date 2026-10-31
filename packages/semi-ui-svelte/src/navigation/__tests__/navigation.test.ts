import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ItemKey, NavClickData, NavItems, NavOpenChangeData, NavProps, OnSelectedData } from '../interface';
import NavChildren from './nav-children.svelte';
import NavFixture from './nav-fixture.svelte';
import NavModes from './nav-modes.svelte';

const prefix = 'semi-navigation';

const treeItems: NavItems = [
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

const getList = () => document.querySelector(`.${prefix} .${prefix}-list`) as HTMLElement;
const getSubTitle = (text: string) => screen.getByText(text).closest(`.${prefix}-sub-title`) as HTMLElement;
const getItem = (text: string) => screen.getByText(text).closest(`.${prefix}-item`) as HTMLElement;
const isSelected = (text: string) => getItem(text).classList.contains(`${prefix}-item-selected`);
const isOpen = (text: string) => getSubTitle(text).getAttribute('aria-expanded') === 'true';
const getCollapseButton = () => document.querySelector(`.${prefix}-footer .${prefix}-collapse-btn button`) as HTMLElement;

async function click(element: Element) {
    await fireEvent.click(element);
    flushSync();
}

function renderNav(props: NavProps, options: { snippets?: boolean; wrap?: boolean } = {}) {
    const store = createStore({ props, snippets: options.snippets ?? false, wrap: options.wrap ?? false });
    render(NavFixture, { props: { store } });
    return store;
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Svelte Navigation', () => {
    it('外观：header、footer 按钮、默认展开与列表项数', () => {
        const items = [...treeItems];
        renderNav({ items, openKeys: ['job'], footer: { collapseButton: true }, header: { text: 'Semi 运营后台' } });
        expect(document.querySelector(`.${prefix}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(getSubTitle('任务')).toHaveAttribute('aria-expanded', 'true');
        expect(getSubTitle('用户')).toHaveAttribute('aria-expanded', 'false');
        expect(getList().children).toHaveLength(items.length);
        expect(getCollapseButton()).not.toBeNull();
    });

    it('水平导航没有折叠按钮，忽略 isCollapsed', () => {
        renderNav({ items: treeItems, mode: 'horizontal', isCollapsed: true, footer: { collapseButton: true }, header: { text: 'Semi' } });
        expect(document.querySelector(`.${prefix}`)).toHaveClass(`${prefix}-horizontal`);
        expect(document.querySelector(`.${prefix}`)).not.toHaveClass(`${prefix}-collapsed`);
        expect(document.querySelectorAll(`.${prefix}-item-sub`)).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-collapse-btn`)).toBeNull();
        expect(document.querySelector(`.${prefix}-header-text`)).toHaveTextContent('Semi');
    });

    it('暴露 disclosure 导航结构：landmark、按钮与链接，没有 menu', () => {
        render(NavChildren, { props: { props: { 'aria-label': '主导航', openKeys: ['user'], selectedKeys: ['list'] } } });
        expect(screen.getByRole('navigation', { name: '主导航' })).toHaveClass(prefix);
        expect(screen.queryByRole('menu')).toBeNull();
        expect(screen.queryAllByRole('menuitem')).toHaveLength(0);

        const title = screen.getByRole('button', { name: '用户' });
        expect(title).toHaveClass(`${prefix}-sub-title`);
        expect(title).toHaveAttribute('aria-expanded', 'true');
        const subList = document.getElementById(title.getAttribute('aria-controls') as string) as HTMLElement;
        expect(subList.tagName).toBe('UL');
        expect(subList).toContainElement(screen.getByRole('button', { name: '用户列表' }));
        expect(screen.getByRole('button', { name: '用户列表' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: '首页' })).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('link', { name: '文档' })).toHaveAttribute('href', '#docs');
        for (const list of document.querySelectorAll(`.${prefix} ul`)) {
            for (const child of list.children) {
                expect(child.tagName).toBe('LI');
            }
        }
    });

    it('子项写法：header 与 footer 是承载 NavHeader、NavFooter 的 snippet，嵌套层级由 context 给出', async () => {
        render(NavChildren, { props: { props: { openKeys: ['user', 'deep'], limitIndent: false }, footer: true } });
        expect(document.querySelector(`.${prefix}-header-logo`)).toHaveTextContent('logo');
        expect(document.querySelector(`.${prefix}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(screen.getByRole('link', { name: /Semi 运营后台/ })).toHaveAttribute('href', '/home');
        expect(getCollapseButton()).not.toBeNull();
        // Sub -> Item is level 1, Sub -> Sub -> Item is level 2: one indent placeholder per level beyond the first
        const placeholders = (text: string) => getItem(text).querySelectorAll(`.${prefix}-item-icon-info`).length;
        expect(placeholders('首页')).toBe(1);
        expect(placeholders('用户列表')).toBe(1);
        expect(placeholders('叶子')).toBe(2);
        await click(getCollapseButton());
        expect(document.querySelector(`.${prefix}`)).toHaveClass(`${prefix}-collapsed`);
    });

    it('子项写法：不读取子项，选中项的祖先不自动展开、顶层子菜单也不标记选中，需要用 openKeys 指定', () => {
        render(NavChildren, { props: { props: { selectedKeys: ['leaf'] } } });
        expect(isOpen('用户')).toBe(false);
        expect(screen.queryByText('叶子')).toBeNull();
        expect(getSubTitle('用户')).not.toHaveClass(`${prefix}-sub-title-selected`);
    });

    it('子项写法：openKeys 变化不清掉点击选中的项，openKeys 变回 undefined 时展开状态清空', async () => {
        const store = createStore<{ props: NavProps }>({ props: { openKeys: ['user'] } });
        render(NavChildren, { props: { props: store.props } });
        await click(screen.getByRole('button', { name: '用户列表' }));
        expect(isSelected('用户列表')).toBe(true);
        store.props.openKeys = ['user', 'deep'];
        flushSync();
        expect(isOpen('更多')).toBe(true);
        expect(isSelected('用户列表')).toBe(true);
        store.props.openKeys = undefined;
        flushSync();
        expect(isOpen('用户')).toBe(false);
        expect(isSelected('用户列表')).toBe(true);
    });
});

describe('Svelte Navigation 行为', () => {
    it('以数据报告 select 与 click，select 仅对新选中的项触发', async () => {
        const onSelect = vi.fn<(data: OnSelectedData) => void>();
        const onClick = vi.fn<(data: NavClickData) => void>();
        renderNav({ items: [{ itemKey: 'home', text: '首页', linkOptions: undefined }, '关于'], onClick, onSelect });
        await click(screen.getByRole('button', { name: '首页' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        const data = onSelect.mock.calls[0][0];
        expect(data.itemKey).toBe('home');
        expect(data.selectedKeys).toEqual(['home']);
        expect(data.selectedItems).toEqual([{ itemKey: 'home', text: '首页' }]);
        expect(data.domEvent).toBeInstanceOf(MouseEvent);
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'home', text: '首页' }));
        expect(isSelected('首页')).toBe(true);

        await click(screen.getByRole('button', { name: '首页' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(2);

        await click(screen.getByRole('button', { name: '关于' }));
        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(isSelected('首页')).toBe(false);
        expect(isSelected('关于')).toBe(true);
    });

    it('禁用项不被选中，也不报告', async () => {
        const onSelect = vi.fn<(data: OnSelectedData) => void>();
        const onClick = vi.fn<(data: NavClickData) => void>();
        renderNav({ items: [{ itemKey: 'a', text: '甲', disabled: true }], onClick, onSelect });
        const button = screen.getByRole('button', { name: '甲' });
        expect(button).toHaveAttribute('aria-disabled', 'true');
        await click(button);
        expect(onSelect).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
        expect(isSelected('甲')).toBe(false);
    });

    it('单向传入 selectedKeys 时，打开默认选中项的祖先并标记顶层子菜单为选中', () => {
        renderNav({ items: treeItems, selectedKeys: ['ban'] });
        expect(isOpen('用户')).toBe(true);
        expect(isOpen('任务')).toBe(false);
        expect(isSelected('用户封禁')).toBe(true);
        expect(getSubTitle('用户')).toHaveClass(`${prefix}-sub-title-selected`);
    });

    it('数字 key 的子菜单也被展开并标记为选中', () => {
        renderNav({
            items: [
                { itemKey: 1, text: '一', items: [{ itemKey: 2, text: '二' }] },
                { itemKey: 3, text: '三' },
            ],
            selectedKeys: [2],
        });
        expect(isOpen('一')).toBe(true);
        expect(getSubTitle('一')).toHaveClass(`${prefix}-sub-title-selected`);
        expect(isSelected('二')).toBe(true);
    });

    it('切换子菜单，并以相同数据报告 openChange 与 click', async () => {
        const onOpenChange = vi.fn<(data: NavOpenChangeData) => void>();
        const onClick = vi.fn<(data: NavClickData) => void>();
        renderNav({ items: treeItems, onClick, onOpenChange });
        const title = getSubTitle('用户');
        expect(title).toHaveAttribute('aria-expanded', 'false');
        await click(title);
        expect(title).toHaveAttribute('aria-expanded', 'true');
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange.mock.calls[0][0]).toMatchObject({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        expect(onClick.mock.calls[0][0]).toMatchObject({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        await click(title);
        expect(title).toHaveAttribute('aria-expanded', 'false');
        expect(onOpenChange.mock.calls[1][0]).toMatchObject({ openKeys: [], isOpen: false });
    });

    it('禁用的子菜单不切换', async () => {
        const onOpenChange = vi.fn<(data: NavOpenChangeData) => void>();
        renderNav({ items: [{ itemKey: 'user', text: '用户', disabled: true, items: ['列表'] }], onOpenChange });
        await click(getSubTitle('用户'));
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(getSubTitle('用户')).toHaveAttribute('aria-disabled', 'true');
        expect(isOpen('用户')).toBe(false);
    });

    it('openKeys、selectedKeys 为 null 时按受控的空值处理', async () => {
        renderNav({ items: treeItems, openKeys: null, selectedKeys: null });
        expect(isOpen('用户')).toBe(false);
        expect(isSelected('首页')).toBe(false);
    });

    it('items 变化时重建菜单', () => {
        const store = renderNav({ items: treeItems });
        expect(screen.getByText('首页')).toBeInTheDocument();
        store.props.items = [{ itemKey: 'only', text: '唯一' }];
        flushSync();
        expect(screen.queryByText('首页')).toBeNull();
        expect(screen.getByText('唯一')).toBeInTheDocument();
    });

    it('itemKey 为 0 的项与 itemKey 为 "00" 的项不产生重复的 key', () => {
        renderNav({
            items: [{ itemKey: 0, text: 'zero' }, { itemKey: '00', text: 'double' }, { text: 'anonymous' }],
        });
        expect(getList().children).toHaveLength(3);
    });

    it('折叠按钮切换折叠，折叠时按钮只剩图标并由语言包命名', async () => {
        renderNav({ items: treeItems, footer: { collapseButton: true } });
        const nav = document.querySelector(`.${prefix}`) as HTMLElement;
        expect(nav).not.toHaveClass(`${prefix}-collapsed`);
        expect(getCollapseButton()).toHaveTextContent('收起侧边栏');
        const button = getCollapseButton();
        await click(button);
        expect(nav).toHaveClass(`${prefix}-collapsed`);
        expect(getCollapseButton()).toBe(button);
        expect(button).toHaveAccessibleName('展开侧边栏');
        expect(button).not.toHaveTextContent('侧边栏');
    });

    it('折叠的子菜单不渲染内联列表，子菜单标题没有 aria-expanded', () => {
        renderNav({ items: treeItems, isCollapsed: true, openKeys: ['user'] });
        expect(document.querySelector(`.${prefix}-sub`)).toBeNull();
        expect(getSubTitle('用户')).not.toHaveAttribute('aria-controls');
    });

    it('header 包裹在链接中，折叠时链接仍有可访问名称', () => {
        renderNav({ items: treeItems, isCollapsed: true, header: { link: '/home', text: '总览' } });
        expect(document.querySelector(`.${prefix}-header-text`)).toBeNull();
        expect(screen.getByRole('link', { name: '总览' })).toHaveAttribute('href', '/home');
    });

    it.each([
        [true, 1],
        [false, 2],
    ])('limitIndent 为 %s 时，两层子菜单里的项有 %d 个左侧图标位（子项自带一个，其余是缩进占位）', (limitIndent, count) => {
        renderNav({ items: [{ itemKey: 'a', text: '甲', items: [{ itemKey: 'b', text: '乙', items: [{ itemKey: 'c', text: '丙' }] }] }], limitIndent, openKeys: ['a', 'b'] });
        expect(getItem('丙').querySelectorAll(`.${prefix}-item-icon-info`)).toHaveLength(count);
    });

    it('通过 toggleIconPosition 把展开图标放在左侧', () => {
        renderNav({ items: treeItems, toggleIconPosition: 'left' });
        const inner = getSubTitle('用户').querySelector(`.${prefix}-item-inner`) as HTMLElement;
        expect(inner.firstElementChild).toHaveClass(`${prefix}-item-icon-toggle-left`);
    });
});

describe('Svelte Navigation 受控值（$bindable）', () => {
    const items: NavItems = treeItems;

    const setup = (target: 'selected' | 'open' | 'collapsed', mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: ItemKey[] | boolean | null, accept = true) => {
        const store = createStore<{ selected: ItemKey[] | null | undefined; open: ItemKey[] | null | undefined; collapsed: boolean | undefined; accept: boolean; log: string[] }>({
            selected: target === 'selected' ? (value as ItemKey[] | undefined) : undefined,
            open: target === 'open' ? (value as ItemKey[] | undefined) : undefined,
            collapsed: target === 'collapsed' ? (value as boolean | undefined) : undefined,
            accept,
            log: [],
        });
        render(NavModes, { props: { target, mode, items, store } });
        return store;
    };

    describe('selectedKeys', () => {
        it('不传：点击选中，onSelect 收到数据', async () => {
            const store = setup('selected', 'uncontrolled');
            await click(screen.getByRole('button', { name: '首页' }));
            expect(isSelected('首页')).toBe(true);
            expect(store.log).toEqual(['select home']);
        });

        it('bind：点击写回父级，父级改值同步到组件，并展开新选中项的祖先', async () => {
            const store = setup('selected', 'bind', ['home']);
            expect(isSelected('首页')).toBe(true);
            await click(screen.getByRole('button', { name: '首页' }));
            expect(store.selected).toEqual(['home']);
            store.selected = ['query'];
            flushSync();
            expect(isSelected('任务查询')).toBe(true);
            expect(isSelected('首页')).toBe(false);
            expect(isOpen('任务')).toBe(true);
            await click(screen.getByRole('button', { name: '首页' }));
            expect(store.selected).toEqual(['home']);
        });

        it('bind 重置为 undefined 后清空选中', async () => {
            const store = setup('selected', 'bind', ['home']);
            store.selected = undefined;
            flushSync();
            expect(isSelected('首页')).toBe(false);
        });

        it('函数绑定：setter 拒绝时保持原选中，接受时跟随', async () => {
            const store = setup('selected', 'function', [], false);
            await click(screen.getByRole('button', { name: '首页' }));
            expect(store.log).toEqual(['set home', 'select home']);
            expect(store.selected).toEqual([]);
            expect(isSelected('首页')).toBe(false);

            store.accept = true;
            await click(screen.getByRole('button', { name: '首页' }));
            expect(store.selected).toEqual(['home']);
            expect(isSelected('首页')).toBe(true);
        });

        it('单向传值：点击在本地覆盖，父级再推值时以父级为准', async () => {
            const store = setup('selected', 'one-way', ['home']);
            expect(isSelected('首页')).toBe(true);
            await click(getSubTitle('用户'));
            await click(screen.getByRole('button', { name: '用户列表' }));
            expect(store.selected).toEqual(['home']);
            expect(isSelected('用户列表')).toBe(true);
            expect(isSelected('首页')).toBe(false);
            // openKeys was never given, so the ancestors of the newly pushed selection open
            store.selected = ['query'];
            flushSync();
            expect(isSelected('任务查询')).toBe(true);
            expect(isOpen('任务')).toBe(true);
            expect(isSelected('用户列表')).toBe(false);
        });
    });

    describe('openKeys', () => {
        it('不传：点击切换，onOpenChange 收到数据', async () => {
            const store = setup('open', 'uncontrolled');
            await click(getSubTitle('用户'));
            expect(isOpen('用户')).toBe(true);
            await click(getSubTitle('用户'));
            expect(isOpen('用户')).toBe(false);
            expect(store.log).toEqual(['open user true', 'open user false']);
        });

        it('bind：点击写回父级，父级改值同步到组件', async () => {
            const store = setup('open', 'bind', ['job']);
            expect(isOpen('任务')).toBe(true);
            await click(getSubTitle('用户'));
            expect(store.open).toEqual(['job', 'user']);
            expect(isOpen('用户')).toBe(true);
            store.open = [];
            flushSync();
            expect(isOpen('用户')).toBe(false);
            expect(isOpen('任务')).toBe(false);
        });

        it('函数绑定：setter 拒绝时不展开，接受时展开', async () => {
            const store = setup('open', 'function', [], false);
            await click(getSubTitle('用户'));
            expect(store.log).toEqual(['set user', 'open user true']);
            expect(isOpen('用户')).toBe(false);
            store.accept = true;
            await click(getSubTitle('用户'));
            expect(store.open).toEqual(['user']);
            expect(isOpen('用户')).toBe(true);
        });

        it('单向传值：点击在本地覆盖，父级再推值时以父级为准', async () => {
            const store = setup('open', 'one-way', ['job']);
            await click(getSubTitle('用户'));
            expect(isOpen('用户')).toBe(true);
            expect(store.open).toEqual(['job']);
            store.open = ['user'];
            flushSync();
            expect(isOpen('任务')).toBe(false);
            expect(isOpen('用户')).toBe(true);
        });
    });

    describe('isCollapsed', () => {
        const nav = () => document.querySelector(`.${prefix}`) as HTMLElement;

        it('不传：折叠按钮切换，onCollapseChange 收到新值', async () => {
            const store = setup('collapsed', 'uncontrolled');
            await click(getCollapseButton());
            expect(nav()).toHaveClass(`${prefix}-collapsed`);
            await click(getCollapseButton());
            expect(nav()).not.toHaveClass(`${prefix}-collapsed`);
            expect(store.log).toEqual(['collapse true', 'collapse false']);
        });

        it('bind：点击写回父级，父级改值同步到组件', async () => {
            const store = setup('collapsed', 'bind', false);
            await click(getCollapseButton());
            expect(store.collapsed).toBe(true);
            expect(nav()).toHaveClass(`${prefix}-collapsed`);
            store.collapsed = false;
            flushSync();
            expect(nav()).not.toHaveClass(`${prefix}-collapsed`);
        });

        it('bind 重置为 undefined 后回到内部状态', async () => {
            const store = setup('collapsed', 'bind', true);
            expect(nav()).toHaveClass(`${prefix}-collapsed`);
            store.collapsed = undefined;
            flushSync();
            expect(nav()).toHaveClass(`${prefix}-collapsed`);
            await click(getCollapseButton());
            expect(nav()).not.toHaveClass(`${prefix}-collapsed`);
        });

        it('函数绑定：setter 拒绝时保持展开，接受时折叠', async () => {
            const store = setup('collapsed', 'function', false, false);
            await click(getCollapseButton());
            expect(store.log).toEqual(['set true', 'collapse true']);
            expect(nav()).not.toHaveClass(`${prefix}-collapsed`);
            store.accept = true;
            await click(getCollapseButton());
            expect(store.collapsed).toBe(true);
            expect(nav()).toHaveClass(`${prefix}-collapsed`);
        });

        it('单向传值：点击在本地覆盖，父级再推值时以父级为准', async () => {
            const store = setup('collapsed', 'one-way', false);
            await click(getCollapseButton());
            expect(nav()).toHaveClass(`${prefix}-collapsed`);
            expect(store.collapsed).toBe(false);
            store.collapsed = true;
            flushSync();
            store.collapsed = false;
            flushSync();
            expect(nav()).not.toHaveClass(`${prefix}-collapsed`);
        });
    });
});

describe('Svelte Navigation 的内容 snippet 与属性落点', () => {
    it('Nav 的 icon、text、toggleIcon、expandIcon 以 { item, level } 渲染每个数据项，并给出槽位尺寸', async () => {
        renderNav({ items: treeItems, openKeys: ['user'] }, { snippets: true });
        const icons = screen.getAllByTestId('icon');
        expect(icons).toHaveLength(3);
        for (const icon of icons) {
            expect(icon).toHaveClass('semi-icon-large');
        }
        expect(screen.getByText('首页!')).toHaveAttribute('data-level', '0');
        expect(screen.getByText('用户列表!')).toHaveAttribute('data-level', '1');
        // text snippet replaces what is shown, the item's `text` stays the payload
        expect(screen.getByRole('button', { name: '首页!' })).toBeInTheDocument();
        expect(screen.getAllByTestId('toggle')).toHaveLength(3);
        const expands = screen.getAllByTestId('expand');
        expect(expands).toHaveLength(2);
        expect(expands[0]).toHaveClass(`${prefix}-icon-rotate-180`);
        expect(expands[1]).toHaveClass(`${prefix}-icon-rotate-0`);
    });

    it('wrapper snippet 包住每个项的 li，并带上项的类型与层级', () => {
        renderNav({ items: treeItems, openKeys: ['user'] }, { wrap: true });
        const wrapped = screen.getAllByTestId('wrapped');
        expect(wrapped).toHaveLength(5);
        expect(wrapped.filter((el) => el.dataset.sub === 'true')).toHaveLength(2);
        expect(wrapped.filter((el) => el.dataset.inSub === 'true')).toHaveLength(2);
        for (const el of wrapped) {
            expect(el.children).toHaveLength(1);
            expect(el.firstElementChild?.tagName).toBe('LI');
        }
    });

    it('wrapper 收到的 props 只含传入的字段', () => {
        renderNav({ items: [{ itemKey: 'a', text: '甲', disabled: true }] }, { wrap: true });
        expect(JSON.parse(screen.getByTestId('wrapped').dataset.props as string)).toEqual({ itemKey: 'a', text: '甲', disabled: true });
    });

    it('未知属性透传到根元素，项配置里的 class、style、data-*、aria-* 落在 li，其他字段不落到 DOM', () => {
        renderNav({
            'data-testid': 'root',
            id: 'main-nav',
            items: [{ itemKey: 'a', text: '甲', class: 'extra', style: 'color: red', 'data-x': '1', 'aria-label': '甲项', path: '/a' } as never, { itemKey: 'sub', text: '乙', 'data-y': '2', items: ['丙'] } as never],
        });
        expect(screen.getByTestId('root')).toHaveAttribute('id', 'main-nav');
        const item = getItem('甲');
        expect(item).toHaveClass('extra');
        expect(item).toHaveAttribute('data-x', '1');
        expect(item).not.toHaveAttribute('path');
        expect(item).not.toHaveAttribute('aria-label');
        // aria-* describes the control that takes focus, not the li
        expect(screen.getByRole('button', { name: '甲项' })).toBeInTheDocument();
        expect(getItem('乙')).toHaveAttribute('data-y', '2');
    });

    it('子菜单的 aria-* 放在标题按钮上，而不是 li 上', () => {
        renderNav({ items: [{ itemKey: 'sub', text: '乙', 'aria-label': '乙菜单', items: ['丙'] } as never] });
        const title = screen.getByRole('button', { name: '乙菜单' });
        expect(title).toHaveClass(`${prefix}-sub-title`);
        expect(title.closest('li')).not.toHaveAttribute('aria-label');
    });

    it('链接项渲染为 a，linkOptions 落在链接上，选中时 aria-current', async () => {
        renderNav({ items: [{ itemKey: 'docs', text: '文档', link: '/docs', linkOptions: { target: '_blank', rel: 'noopener' } }] });
        const link = screen.getByRole('link', { name: '文档' });
        expect(link).toHaveAttribute('href', '/docs');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveClass(`${prefix}-item-link`);
        link.addEventListener('click', (event) => event.preventDefault());
        await click(link);
        expect(link).toHaveAttribute('aria-current', 'page');
        expect(getItem('文档')).toHaveClass(`${prefix}-item-has-link`);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Nav: { mode: 'horizontal' } };
        renderNav({ items: treeItems });
        expect(document.querySelector(`.${prefix}`)).toHaveClass(`${prefix}-horizontal`);
    });
});
