/** @jsxImportSource vue */
import { KeepAlive, createSSRApp, defineComponent, nextTick, reactive, ref, shallowRef, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi, type MockInstance } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { IconHome } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Nav, { NavFooter, NavHeader, NavItem, SubNav, type ItemKey, type NavClickData, type NavItemConfig, type NavOpenChangeData, type NavWrapperSlotProps, type OnSelectedData, type SelectedData } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import Button from '../../button';
import ConfigProvider from '../../config-provider';
import Appearance from './fixtures/appearance.vue';
import Collect from './fixtures/collect.vue';
import JsxNav from './fixtures/jsx-nav.vue';
import Model from './fixtures/model.vue';
import SsrNav from './fixtures/ssr-nav.vue';

const prefixCls = 'semi-navigation';

const getList = () => document.querySelector(`.${prefixCls} .${prefixCls}-list`) as HTMLElement;
const getOpenSubs = () => document.querySelectorAll(`.${prefixCls}-item-sub .${prefixCls}-sub-open`);
const getCollapseButton = () => document.querySelector(`.${prefixCls}-footer .${prefixCls}-collapse-btn button`) as HTMLElement;
const getSubTitle = (text: string) => screen.getByText(text).closest(`.${prefixCls}-sub-title`) as HTMLElement;
const getItem = (text: string) => screen.getByText(text).closest(`.${prefixCls}-item`) as HTMLElement;
const getItemControl = (text: string) => screen.getByText(text).closest('a, button') as HTMLElement;
const isSelected = (text: string) => getItem(text).classList.contains(`${prefixCls}-item-selected`);
const isOpen = (text: string) => getSubTitle(text).getAttribute('aria-expanded') === 'true';

const onSelectSpy = () => vi.fn<(data: OnSelectedData) => void>();
const onClickSpy = () => vi.fn<(data: NavClickData) => void>();
const onOpenChangeSpy = () => vi.fn<(data: NavOpenChangeData) => void>();
const onCollapseChangeSpy = () => vi.fn<(collapsed: boolean) => void>();

const jsxChildren = (): VNode => (
    <>
        <NavItem itemKey="home" text="首页" />
        <SubNav itemKey="user" text="用户">
            {() => (
                <>
                    <NavItem itemKey="list" text="用户列表" />
                    <NavItem itemKey="ban" text="用户封禁" />
                </>
            )}
        </SubNav>
        <SubNav itemKey="job" text="任务">
            {() => <NavItem itemKey="query" text="任务查询" />}
        </SubNav>
    </>
);
const renderJsx = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => render(Nav, { props, slots: { default: jsxChildren, ...slots } });
const renderNav = (props: Record<string, unknown>, children?: () => unknown) => render(Nav, { props, slots: children ? { default: children } : {} });
const renderEnglish = (vnode: () => VNode) => render({ render: () => <ConfigProvider locale={en_US}>{vnode}</ConfigProvider> });

const treeItems: NavItemConfig[] = [
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

// Tooltip re-checks `:hover` once the popup is positioned, and jsdom never matches it. closest() does not go through
// the spied matches, and an element is its own closest match.
let hovered: MockInstance | undefined;
function hover(el: Element) {
    hovered = vi.spyOn(Element.prototype, 'matches').mockImplementation(function matches(this: Element, selector: string) {
        return selector === ':hover' ? this.contains(el) : this.closest(selector) === this;
    });
    return fireEvent.mouseEnter(el);
}
function unhover(el: Element) {
    hovered?.mockRestore();
    return fireEvent.mouseLeave(el);
}
const useFakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Navigation', () => {
    it('外观', () => {
        const items = [
            { itemKey: 'user', text: '用户管理' },
            { itemKey: 'union', text: '公会中心' },
            { itemKey: 'union-management', text: '公会管理', items: ['公告设置', '公会查询', '信息录入'] },
            { text: '任务平台', itemKey: 'job', items: ['任务管理', '用户任务查询'] },
        ];
        render(Nav, {
            props: {
                bodyStyle: { height: '320px' },
                defaultOpenKeys: ['job'],
                footer: { collapseButton: true },
                header: { text: 'Semi 运营后台' },
                items,
            },
            slots: { header: () => <img alt="" src="/logo.svg" /> },
        });
        expect(document.querySelector(`.${prefixCls}-header img`)).toHaveAttribute('src', '/logo.svg');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(getOpenSubs()).toHaveLength(1);
        expect(getOpenSubs()[0]).toHaveTextContent('任务管理用户任务查询');
        expect(getSubTitle('任务平台')).toHaveAttribute('aria-expanded', 'true');
        expect(getSubTitle('公会管理')).toHaveAttribute('aria-expanded', 'false');
        expect(getList().children).toHaveLength(items.length);
        expect(getCollapseButton()).not.toBeNull();
    });

    it('使用模板定义的外观', () => {
        render(Appearance);
        expect(document.querySelector(`.${prefixCls}-header-logo`)).toHaveTextContent('bytedance_logo');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(getOpenSubs()).toHaveLength(1);
        expect(getOpenSubs()[0]).toHaveTextContent('金主管理用户封禁');
        expect(getList().children).toHaveLength(3);
        expect(getCollapseButton()).not.toBeNull();
    });

    it('水平导航外观', () => {
        const items = [
            { itemKey: 'user', text: '用户管理' },
            { itemKey: 'union', text: '公会中心' },
            {
                itemKey: 'approve-management',
                text: '审批管理',
                items: ['入驻审核', { itemKey: 'operation-management', text: '运营管理', items: ['人员管理', '人员变更'] }],
            },
            { text: '任务平台', itemKey: 'job', items: ['任务管理', '用户任务查询'] },
        ];
        renderNav({ footer: { collapseButton: true }, header: { text: 'Semi 运营后台' }, items, mode: 'horizontal' });
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(document.querySelectorAll(`.${prefixCls}-item-sub`)).toHaveLength(2);
        expect(getList().children).toHaveLength(items.length);
        expect(document.querySelector(`.${prefixCls}-footer .${prefixCls}-collapse-btn`)).toBeNull();
    });

    it('v-model 绑定的 selected、open 与 collapsed', async () => {
        const items = [
            { itemKey: 'user', text: '用户管理' },
            { itemKey: 'union-management', text: '公会管理', items: ['公告设置', '公会查询', '信息录入'] },
            { text: '任务平台', itemKey: 'job', items: ['任务管理', '用户任务查询'] },
        ];
        const onSelect = onSelectSpy();
        const onOpenChange = onOpenChangeSpy();
        const onCollapseChange = onCollapseChangeSpy();
        const onUpdateSelected = vi.fn<(keys: ItemKey[]) => void>();
        const onUpdateOpen = vi.fn<(keys: ItemKey[]) => void>();
        const onUpdateCollapsed = vi.fn<(collapsed: boolean) => void>();
        render(Model, {
            props: {
                items,
                open: ['union-management', 'job'],
                selected: ['用户任务查询'],
                onSelect,
                onOpenChange,
                onCollapseChange,
                'onUpdate:selectedKeys': onUpdateSelected,
                'onUpdate:openKeys': onUpdateOpen,
                'onUpdate:isCollapsed': onUpdateCollapsed,
            },
        });
        const model = () => JSON.parse(screen.getByTestId('model').textContent as string);
        expect(isOpen('公会管理')).toBe(true);
        expect(isOpen('任务平台')).toBe(true);
        expect(isSelected('用户任务查询')).toBe(true);

        await userEvent.click(getSubTitle('公会管理'));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange.mock.calls[0][0].openKeys).toEqual(['job']);
        expect(onUpdateOpen).toHaveBeenCalledTimes(1);
        expect(model().openKeys).toEqual(['job']);
        expect(isOpen('公会管理')).toBe(false);
        expect(isOpen('任务平台')).toBe(true);

        await userEvent.click(screen.getByRole('button', { name: '任务管理' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onUpdateSelected).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].selectedKeys).toEqual(['任务管理']);
        expect(model().selectedKeys).toEqual(['任务管理']);
        expect(isSelected('任务管理')).toBe(true);
        expect(isSelected('用户任务查询')).toBe(false);

        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledTimes(1);
        expect(onCollapseChange).toHaveBeenCalledWith(true);
        expect(onUpdateCollapsed).toHaveBeenCalledTimes(1);
        expect(model().isCollapsed).toBe(true);
        expect(document.querySelectorAll(`.${prefixCls}-collapsed`)).toHaveLength(1);
    });

    it('函数调用参数', async () => {
        const onSelect = onSelectSpy();
        const onOpenChange = onOpenChangeSpy();
        const onCollapseChange = onCollapseChangeSpy();
        const onClick = onClickSpy();
        renderNav({
            footer: { collapseButton: true },
            items: [
                { itemKey: 'user', text: '用户管理' },
                { itemKey: 'union', text: '公会中心' },
                { text: '任务平台', itemKey: 'job', items: ['任务管理', '用户任务查询'] },
            ],
            onClick,
            onCollapseChange,
            onOpenChange,
            onSelect,
        });
        await userEvent.click(document.querySelector(`.${prefixCls}-sub-title`) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].itemKey).toBe('job');
        expect(onOpenChange.mock.calls[0][0].itemKey).toBe('job');

        await userEvent.click(document.querySelector(`.${prefixCls}-item-button`) as HTMLElement);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].itemKey).toBe('user');

        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledTimes(1);
        expect(onCollapseChange).toHaveBeenCalledWith(true);
    });

    it('itemKey 为数字类型时的展开', async () => {
        const onOpenChange = onOpenChangeSpy();
        const onClick = onClickSpy();
        renderNav({
            items: [
                { itemKey: 'user', text: '用户管理' },
                { text: '任务平台', itemKey: 2, items: ['任务管理', '用户任务查询'] },
            ],
            onClick,
            onOpenChange,
        });
        expect(getOpenSubs()).toHaveLength(0);
        await userEvent.click(document.querySelector(`.${prefixCls}-sub-title`) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].itemKey).toBe(2);
        expect(onOpenChange.mock.calls[0][0].itemKey).toBe(2);
        expect(getOpenSubs()).toHaveLength(1);
        expect(getOpenSubs()[0]).toHaveTextContent('任务管理用户任务查询');
    });

    it('暴露 disclosure 导航结构', () => {
        renderNav({ 'aria-label': '主导航', defaultOpenKeys: ['user'], defaultSelectedKeys: ['list'] }, () => (
            <>
                <SubNav itemKey="user" text="用户管理">
                    {() => <NavItem itemKey="list" text="用户列表" />}
                </SubNav>
                <NavItem itemKey="home" text="首页" />
                <NavItem itemKey="docs" link="/docs" text="文档" />
                <span>其他内容</span>
            </>
        ));
        expect(screen.getByRole('navigation', { name: '主导航' })).toHaveClass(prefixCls);
        expect(screen.queryByRole('menu')).toBeNull();
        expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
        expect(screen.queryByRole('group')).toBeNull();

        const title = screen.getByRole('button', { name: '用户管理' });
        expect(title).toHaveClass(`${prefixCls}-sub-title`);
        expect(title).toHaveAttribute('aria-expanded', 'true');
        const subList = document.getElementById(title.getAttribute('aria-controls') as string) as HTMLElement;
        expect(subList.tagName).toBe('UL');
        expect(subList).toContainElement(screen.getByRole('button', { name: '用户列表' }));

        expect(screen.getByRole('button', { name: '用户列表' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: '首页' })).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('link', { name: '文档' })).toHaveAttribute('href', '/docs');

        for (const list of document.querySelectorAll(`.${prefixCls} ul`)) {
            for (const child of list.children) {
                expect(child.tagName).toBe('LI');
            }
        }
        expect(screen.getByText('其他内容').parentElement?.parentElement).toBe(getList());
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });

    it('Tab 可到达每个项与子标题，且只到达这些', async () => {
        renderNav({ defaultOpenKeys: ['user'] }, () => (
            <>
                <NavItem itemKey="home" text="首页" />
                <SubNav itemKey="user" text="用户">
                    {() => <NavItem itemKey="list" text="用户列表" />}
                </SubNav>
                <NavItem itemKey="docs" link="/docs" text="文档" />
                <SubNav itemKey="job" text="任务">
                    {() => <NavItem itemKey="query" text="任务查询" />}
                </SubNav>
            </>
        ));
        const stops: string[] = [];
        await userEvent.tab();
        while (document.activeElement !== document.body) {
            stops.push(`${document.activeElement?.tagName} ${document.activeElement?.textContent}`);
            await userEvent.tab();
        }
        expect(stops).toEqual(['BUTTON 首页', 'BUTTON 用户', 'BUTTON 用户列表', 'A 文档', 'BUTTON 任务']);
    });

    it('Enter 与 Space 激活项并切换子菜单', async () => {
        const onSelect = onSelectSpy();
        const onOpenChange = onOpenChangeSpy();
        renderJsx({ onOpenChange, onSelect });
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'home' }));
        expect(screen.getByRole('button', { name: '首页' })).toHaveAttribute('aria-current', 'page');

        await userEvent.tab();
        const title = screen.getByRole('button', { name: '用户' });
        expect(title).toHaveFocus();
        await userEvent.keyboard(' ');
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(title).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Enter}');
        expect(onOpenChange).toHaveBeenCalledTimes(2);
        expect(title).toHaveAttribute('aria-expanded', 'false');
    });

    it('把 popup 子菜单的标题设为 menu button', async () => {
        useFakeTimers();
        renderJsx({ mode: 'horizontal' });
        const title = screen.getByRole('button', { name: '用户' });
        expect(title).toHaveAttribute('aria-haspopup', 'menu');
        expect(title).toHaveAttribute('aria-expanded', 'false');
        expect(title).not.toHaveAttribute('aria-controls');
        // a hover trigger also opens on focus; the popup reports visible after its positioning fallback
        title.focus();
        await vi.advanceTimersByTimeAsync(0);
        expect(screen.getByRole('menu')).toHaveTextContent('用户列表');
        await vi.advanceTimersByTimeAsync(500);
        expect(title).toHaveAttribute('aria-expanded', 'true');
    });

    it('popup 子菜单标题上的 Enter 与 Space 只报告一次', async () => {
        const onClick = onClickSpy();
        renderJsx({ mode: 'horizontal', onClick });
        screen.getByRole('button', { name: '用户' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('水平模式忽略 isCollapsed', () => {
        renderJsx({ mode: 'horizontal', isCollapsed: true, header: { text: 'Semi' } });
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-collapsed`);
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi');
        expect(screen.getByRole('button', { name: '首页' })).toHaveTextContent('首页');
    });

    it('折叠时，顶层项的焦点目标是其按钮，由 tooltip 描述', async () => {
        renderJsx({ isCollapsed: true });
        await userEvent.tab();
        const button = screen.getByRole('button', { name: '首页' });
        expect(button).toHaveFocus();
        expect(button.closest('li')).not.toHaveAttribute('tabindex');
        await waitFor(() => expect(button).toHaveAccessibleDescription('首页'));
        await userEvent.tab();
        expect(screen.getByRole('button', { name: '用户' })).toHaveFocus();
    });

    it('服务端渲染时默认展开的子菜单保持展开', async () => {
        const html = await renderToString(createSSRApp({ render: () => <SsrNav defaultOpenKeys={['user']} /> }));
        const wrappers = [...html.matchAll(/class="semi-collapsible-wrapper"[^>]*style="([^"]*)"/g)].map((m) => m[1]);
        expect(wrappers).toHaveLength(2);
        expect(wrappers[0]).toContain('--semi-collapsible-height:calc-size(auto, size)');
        expect(wrappers[1]).toContain('--semi-collapsible-height:0px');
        expect(html).toContain('用户列表');
    });
});

describe('Navigation 行为', () => {
    it('由 items 与 children 渲染相同的菜单', async () => {
        const view = renderNav({ defaultSelectedKeys: ['list'], items: treeItems });
        const fromItems = getList().innerHTML;
        view.unmount();
        renderJsx({ defaultSelectedKeys: ['list'] });
        // the ids that tie each sub title to its list are generated per app; fragments leave different anchors
        const normalize = (html: string) => html.replaceAll(/test-\d+-\d+/g, '').replaceAll(/<!--.*?-->/g, '');
        expect(normalize(getList().innerHTML)).toBe(normalize(fromItems));
    });

    it('以数据报告 select 与 click，select 仅对新选中的项触发', async () => {
        const onSelect = onSelectSpy();
        const onClick = onClickSpy();
        const onItemClick = vi.fn<(data: SelectedData) => void>();
        renderNav({ onClick, onSelect }, () => (
            <>
                <NavItem itemKey="home" text="首页" onClick={onItemClick}>
                    {{
                        icon: () => <span>i</span>,
                    }}
                </NavItem>
                <NavItem itemKey="about" text="关于" />
            </>
        ));
        await userEvent.click(getItemControl('首页'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        const data = onSelect.mock.calls[0][0];
        expect(data.itemKey).toBe('home');
        expect(data.selectedKeys).toEqual(['home']);
        expect(data.selectedItems).toHaveLength(1);
        expect(data.selectedItems[0]).toMatchObject({ itemKey: 'home', text: '首页' });
        expect(data.domEvent.type).toBe('click');
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'home', text: '首页' }));
        expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'home', text: '首页' }));
        expect(isSelected('首页')).toBe(true);

        await userEvent.click(getItemControl('首页'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(2);

        await userEvent.click(getItemControl('关于'));
        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(isSelected('关于')).toBe(true);
        expect(isSelected('首页')).toBe(false);
    });

    it('禁用项不被选中，也不报告', async () => {
        const onSelect = onSelectSpy();
        const onClick = onClickSpy();
        renderNav({ onClick, onSelect }, () => <NavItem disabled itemKey="home" text="首页" />);
        expect(getItemControl('首页')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getItemControl('首页'));
        expect(onSelect).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
        expect(isSelected('首页')).toBe(false);
    });

    it('打开默认选中项的祖先，并标记顶层子菜单为选中', () => {
        renderJsx({ defaultSelectedKeys: ['ban'] });
        expect(isOpen('用户')).toBe(true);
        expect(isOpen('任务')).toBe(false);
        expect(getSubTitle('用户')).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(isSelected('用户封禁')).toBe(true);
    });

    // React compares String(itemKey) while the parent key added to selectedKeys keeps its number type
    it('数字 key 的子菜单标记为选中', () => {
        renderNav({ defaultSelectedKeys: ['list'] }, () => (
            <>
                <NavItem itemKey="home" text="首页" />
                <SubNav itemKey={1} text="用户">
                    {() => <NavItem itemKey="list" text="用户列表" />}
                </SubNav>
            </>
        ));
        expect(isSelected('用户列表')).toBe(true);
        expect(getSubTitle('用户')).toHaveClass(`${prefixCls}-sub-title-selected`);
    });

    it('切换子菜单，并以相同数据报告 openChange 与 click', async () => {
        const onOpenChange = onOpenChangeSpy();
        const onClick = onClickSpy();
        renderJsx({ onClick, onOpenChange });
        await userEvent.click(getSubTitle('用户'));
        expect(isOpen('用户')).toBe(true);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        const data = onOpenChange.mock.calls[0][0];
        expect(data).toMatchObject({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        expect(data.domEvent?.type).toBe('click');
        expect(onClick.mock.calls[0][0]).toBe(data);

        await userEvent.click(getSubTitle('任务'));
        expect(onOpenChange.mock.calls[1][0]).toMatchObject({
            itemKey: 'job',
            openKeys: ['user', 'job'],
            isOpen: true,
        });

        await userEvent.click(getSubTitle('用户'));
        expect(isOpen('用户')).toBe(false);
        expect(onOpenChange.mock.calls[2][0]).toMatchObject({ itemKey: 'user', openKeys: ['job'], isOpen: false });
    });

    it('禁用的子菜单不切换', async () => {
        const onOpenChange = onOpenChangeSpy();
        renderNav({ onOpenChange }, () => (
            <SubNav disabled itemKey="user" text="用户">
                {() => <NavItem itemKey="list" text="用户列表" />}
            </SubNav>
        ));
        expect(getSubTitle('用户')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getSubTitle('用户'));
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(isOpen('用户')).toBe(false);
    });

    it('受控的 openKeys 在属性变化前保持不变', async () => {
        const onOpenChange = onOpenChangeSpy();
        const view = renderJsx({ openKeys: [], onOpenChange });
        await userEvent.click(getSubTitle('用户'));
        expect(onOpenChange).toHaveBeenCalledWith(expect.objectContaining({ openKeys: ['user'], isOpen: true }));
        expect(isOpen('用户')).toBe(false);
        await view.rerender({ openKeys: ['job'] });
        expect(isOpen('用户')).toBe(false);
        expect(isOpen('任务')).toBe(true);
    });

    it('openKeys、selectedKeys 为 null 时按受控的空值处理', async () => {
        renderJsx({ defaultSelectedKeys: ['home'], openKeys: null, selectedKeys: null });
        expect(isSelected('首页')).toBe(false);
        await userEvent.click(getSubTitle('用户'));
        expect(isOpen('用户')).toBe(false);
        await userEvent.click(getItemControl('首页'));
        expect(isSelected('首页')).toBe(false);
    });

    it('受控的 selectedKeys 在属性变化前保持不变，新选中 key 的父级会被打开', async () => {
        const onSelect = onSelectSpy();
        const view = renderJsx({ selectedKeys: ['home'], onSelect });
        await userEvent.click(getSubTitle('用户'));
        await userEvent.click(getItemControl('用户列表'));
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'list', selectedKeys: ['list'] }));
        expect(isSelected('首页')).toBe(true);
        expect(isSelected('用户列表')).toBe(false);

        await view.rerender({ selectedKeys: ['query'] });
        expect(isSelected('任务查询')).toBe(true);
        expect(isSelected('首页')).toBe(false);
        expect(getSubTitle('任务')).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(isOpen('用户')).toBe(true);
        expect(isOpen('任务')).toBe(true);
    });

    it('items 写法下受控的 selectedKeys、openKeys 变回 undefined 时清空', async () => {
        const view = renderNav({ items: treeItems, openKeys: ['user'], selectedKeys: ['home'] });
        expect(isSelected('首页')).toBe(true);
        expect(isOpen('用户')).toBe(true);
        await view.rerender({ openKeys: undefined, selectedKeys: undefined });
        expect(isSelected('首页')).toBe(false);
        expect(isOpen('用户')).toBe(false);
    });

    it('受控的 selectedKeys 变化时，已打开的子菜单重置为 defaultOpenKeys', async () => {
        const view = renderNav({ defaultOpenKeys: ['user'], items: treeItems, selectedKeys: ['home'] });
        await userEvent.click(getSubTitle('任务'));
        expect(isOpen('任务')).toBe(true);
        await view.rerender({ selectedKeys: ['home'] });
        expect(isOpen('任务')).toBe(true);
        await view.rerender({ selectedKeys: ['list'] });
        expect(isOpen('任务')).toBe(false);
        expect(isOpen('用户')).toBe(true);
    });

    it('items 变化时重建菜单', async () => {
        const view = renderNav({ defaultSelectedKeys: ['query'], items: treeItems });
        expect(isOpen('任务')).toBe(true);
        await view.rerender({ items: [treeItems[0], treeItems[2]] });
        expect(screen.queryByText('用户')).toBeNull();
        expect(getList().children).toHaveLength(2);
        expect(isSelected('任务查询')).toBe(true);
    });

    it('defaultIsCollapsed 时折叠，并可通过折叠按钮切换', async () => {
        const onCollapseChange = onCollapseChangeSpy();
        renderEnglish(() => <Nav defaultIsCollapsed footer={{ collapseButton: true }} header={{ text: 'Semi 运营后台' }} items={treeItems} onCollapseChange={onCollapseChange} />);
        const root = document.querySelector(`.${prefixCls}`) as HTMLElement;
        expect(root).toHaveClass(`${prefixCls}-collapsed`);
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveClass(`${prefixCls}-header-collapsed`);
        expect(document.querySelector(`.${prefixCls}-header-text`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveClass(`${prefixCls}-footer-collapsed`);
        expect(getCollapseButton()).not.toHaveTextContent('Expand Sidebar');
        expect(getCollapseButton()).toHaveAccessibleName('Expand Sidebar');
        expect(document.querySelector(`.${prefixCls}-sub`)).toBeNull();

        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledWith(false);
        expect(root).not.toHaveClass(`${prefixCls}-collapsed`);
        expect(getCollapseButton()).toHaveTextContent('Collapse Sidebar');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
    });

    it('保持受控的 isCollapsed，并使用 #collapseText', async () => {
        const onCollapseChange = onCollapseChangeSpy();
        const collapseText = vi.fn<(props: { collapsed: boolean }) => string>(({ collapsed }) => (collapsed ? 'open it' : 'close it'));
        const view = render(Nav, {
            props: { footer: { collapseButton: true }, isCollapsed: false, onCollapseChange },
            slots: { collapseText },
        });
        expect(collapseText).not.toHaveBeenCalled();
        view.unmount();

        const state = reactive({ isCollapsed: false });
        render({
            render: () => (
                <Nav isCollapsed={state.isCollapsed} onCollapseChange={onCollapseChange}>
                    {() => <NavFooter collapseButton>{{ collapseText }}</NavFooter>}
                </Nav>
            ),
        });
        expect(getCollapseButton()).toHaveTextContent('close it');
        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledWith(true);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-collapsed`);
        state.isCollapsed = true;
        await nextTick();
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-collapsed`);
        expect(collapseText).toHaveBeenLastCalledWith({ collapsed: true });
        expect(getCollapseButton()).toHaveAccessibleName('open it');
        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenLastCalledWith(false);
    });

    it('渲染自定义折叠按钮、footer 子元素与 footer click', async () => {
        const onFooterClick = vi.fn<(event: MouseEvent) => void>();
        renderNav({}, () => (
            <>
                <NavItem itemKey="home" text="首页" />
                <NavFooter onClick={onFooterClick}>
                    {{
                        collapseButton: () => <span>custom button</span>,
                    }}
                </NavFooter>
            </>
        ));
        expect(screen.getByText('custom button')).toBeInTheDocument();
        expect(getCollapseButton()).toBeNull();
        await userEvent.click(screen.getByText('custom button'));
        expect(onFooterClick).toHaveBeenCalledTimes(1);
        expect(onFooterClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('header 包裹在链接中', () => {
        renderNav({ header: { text: 'Semi', link: '/home', linkOptions: { target: '_blank' } } });
        const link = document.querySelector(`.${prefixCls}-header-link`);
        expect(link).toHaveAttribute('href', '/home');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveTextContent('Semi');
    });

    it('#header 与 #footer 的内容渲染在 header 与 footer 中', () => {
        render(Nav, { slots: { header: () => 'Semi 运营后台', footer: () => '版权所有' } });
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveTextContent('Semi 运营后台');
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveTextContent('版权所有');
    });

    it('折叠的子菜单在悬停 subNavOpenDelay 后打开 popup，在 subNavCloseDelay 后关闭', async () => {
        useFakeTimers();
        const onOpenChange = onOpenChangeSpy();
        renderJsx({ isCollapsed: true, subNavCloseDelay: 300, subNavOpenDelay: 200, onOpenChange });
        const title = getSubTitle('用户');
        await hover(title);
        await vi.advanceTimersByTimeAsync(199);
        expect(screen.queryByText('用户列表')).toBeNull();
        expect(onOpenChange).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(screen.getByText('用户列表')).toBeInTheDocument();
        expect(getItem('用户列表')).toHaveClass('semi-dropdown-item');
        await vi.advanceTimersByTimeAsync(100);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenLastCalledWith({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        expect(isOpen('用户')).toBe(true);

        await unhover(title);
        await vi.advanceTimersByTimeAsync(299);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(onOpenChange).toHaveBeenLastCalledWith({ itemKey: 'user', openKeys: [], isOpen: false });
        expect(isOpen('用户')).toBe(false);
    });

    it('subNavOpenDelay 为 0 时，悬停即报告 popup 可见', async () => {
        useFakeTimers();
        const onOpenChange = onOpenChangeSpy();
        renderJsx({ isCollapsed: true, subNavOpenDelay: 0, onOpenChange });
        await hover(getSubTitle('用户'));
        // no minimum delay: the popup is inserted at once, and Dropdown reports visible after its positioning fallback
        await vi.advanceTimersByTimeAsync(0);
        expect(screen.getByText('用户列表')).toBeInTheDocument();
        await vi.advanceTimersByTimeAsync(100);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenLastCalledWith({ itemKey: 'user', openKeys: ['user'], isOpen: true });
    });

    it('导航卸载时取消待执行的悬停打开', async () => {
        useFakeTimers();
        const onOpenChange = onOpenChangeSpy();
        const view = renderJsx({ isCollapsed: true, subNavOpenDelay: 200, onOpenChange });
        const before = vi.getTimerCount();
        await hover(getSubTitle('用户'));
        expect(vi.getTimerCount()).toBe(before + 1);
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(1000);
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('选中水平子菜单 popup 中的项', async () => {
        useFakeTimers();
        const onSelect = onSelectSpy();
        renderJsx({ mode: 'horizontal', onSelect });
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-horizontal`);
        expect(screen.queryByText('任务查询')).toBeNull();
        await hover(getSubTitle('任务'));
        await vi.advanceTimersByTimeAsync(100);
        expect(getItem('任务查询')).toHaveClass('semi-dropdown-item');
        await fireEvent.mouseDown(getItem('任务查询'));
        await fireEvent.click(getItem('任务查询'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'query', selectedKeys: ['query'] }));
    });

    it('Enter 选中 popup 项只触发一次', async () => {
        useFakeTimers();
        const onSelect = onSelectSpy();
        renderJsx({ mode: 'horizontal', onSelect });
        await hover(getSubTitle('任务'));
        await vi.advanceTimersByTimeAsync(100);
        await fireEvent.keyDown(getItem('任务查询'), { key: 'Enter', code: 'Enter' });
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'query' }));
    });

    it.each([
        ['horizontal', 'hover'],
        ['collapsed', 'hover'],
        ['horizontal', 'click'],
        ['collapsed', 'click'],
    ] as const)('%s 弹层内嵌套 Sub（trigger=%s）标题按 Enter 只报告一次 openChange', async (kind, trigger) => {
        useFakeTimers();
        const onOpenChange = onOpenChangeSpy();
        renderNav(
            {
                isCollapsed: kind === 'collapsed',
                mode: kind === 'horizontal' ? 'horizontal' : 'vertical',
                onOpenChange,
            },
            () => (
                <SubNav itemKey="job" text="任务">
                    {() => (
                        <SubNav dropdownProps={{ trigger }} itemKey="inner" text="子任务">
                            {() => <NavItem itemKey="deep" text="深层项" />}
                        </SubNav>
                    )}
                </SubNav>
            )
        );
        await hover(getSubTitle('任务'));
        await vi.advanceTimersByTimeAsync(200);
        onOpenChange.mockClear();
        const title = getSubTitle('子任务');
        expect(title).toHaveAttribute('role', 'menuitem');
        title.focus();
        await fireEvent.keyDown(title, { key: 'Enter', code: 'Enter' });
        // the Dropdown reports its visibility only after positioning
        await vi.advanceTimersByTimeAsync(500);
        const inner = onOpenChange.mock.calls.filter(([data]) => data.itemKey === 'inner');
        expect(inner).toHaveLength(1);
        expect(inner[0][0]).toMatchObject({ isOpen: true });
        expect(inner[0][0].openKeys).toContain('inner');
    });

    it.each(['horizontal', 'collapsed'] as const)('%s 弹层内嵌套 Sub 已被焦点打开时，Enter 不关闭它', async (kind) => {
        useFakeTimers();
        const onOpenChange = onOpenChangeSpy();
        renderNav(
            {
                isCollapsed: kind === 'collapsed',
                mode: kind === 'horizontal' ? 'horizontal' : 'vertical',
                onOpenChange,
            },
            () => (
                <SubNav itemKey="job" text="任务">
                    {() => (
                        <SubNav itemKey="inner" text="子任务">
                            {() => <NavItem itemKey="deep" text="深层项" />}
                        </SubNav>
                    )}
                </SubNav>
            )
        );
        await hover(getSubTitle('任务'));
        await vi.advanceTimersByTimeAsync(200);
        const title = getSubTitle('子任务');
        title.focus();
        await vi.advanceTimersByTimeAsync(500);
        expect(getItem('深层项')).toBeInTheDocument();
        onOpenChange.mockClear();
        await fireEvent.keyDown(title, { key: 'Enter', code: 'Enter' });
        await vi.advanceTimersByTimeAsync(500);
        expect(onOpenChange.mock.calls.filter(([data]) => data.isOpen === false)).toHaveLength(0);
        expect(getItem('深层项')).toBeInTheDocument();
    });

    it.each([
        ['horizontal', 'nested'],
        ['collapsed', 'nested'],
        ['horizontal', 'top'],
        ['collapsed', 'top'],
    ] as const)('%s 弹层的 %s Sub（trigger=click）鼠标单击只报告一次 openChange', async (kind, level) => {
        useFakeTimers();
        const onOpenChange = onOpenChangeSpy();
        const onClick = onClickSpy();
        const click = { dropdownProps: { trigger: 'click' as const } };
        renderNav(
            {
                isCollapsed: kind === 'collapsed',
                mode: kind === 'horizontal' ? 'horizontal' : 'vertical',
                onClick,
                onOpenChange,
            },
            () => (
                <SubNav itemKey="job" text="任务" {...(level === 'top' ? click : {})}>
                    {() => (
                        <SubNav itemKey="inner" text="子任务" {...click}>
                            {() => <NavItem itemKey="deep" text="深层项" />}
                        </SubNav>
                    )}
                </SubNav>
            )
        );
        const target = level === 'top' ? 'job' : 'inner';
        if (level === 'nested') {
            await hover(getSubTitle('任务'));
            await vi.advanceTimersByTimeAsync(200);
        }
        onOpenChange.mockClear();
        await fireEvent.click(getSubTitle(level === 'top' ? '任务' : '子任务'));
        await vi.advanceTimersByTimeAsync(500);
        const calls = onOpenChange.mock.calls.filter(([data]) => data.itemKey === target);
        expect(calls).toHaveLength(1);
        expect(calls[0][0]).toMatchObject({ isOpen: true });
        expect(calls[0][0].openKeys).toContain(target);
        expect(onClick.mock.calls.filter(([data]) => data.itemKey === target)).toHaveLength(1);
    });

    it('Item 点击、Sub 点击与 popup 项 Enter 都以原生事件报告 domEvent', async () => {
        const onClick = onClickSpy();
        const onSelect = onSelectSpy();
        const view = renderJsx({ onClick, onSelect });
        await userEvent.click(getItemControl('首页'));
        await userEvent.click(getSubTitle('用户'));
        view.unmount();

        useFakeTimers();
        renderJsx({ mode: 'horizontal', onClick, onSelect });
        await hover(getSubTitle('任务'));
        await vi.advanceTimersByTimeAsync(100);
        await fireEvent.keyDown(getItem('任务查询'), { key: 'Enter', code: 'Enter' });

        expect(onClick.mock.calls.map(([data]) => data.itemKey)).toEqual(['home', 'user', 'query']);
        expect(onSelect.mock.calls.map(([data]) => data.itemKey)).toEqual(['home', 'query']);
        for (const [data] of [...onClick.mock.calls, ...onSelect.mock.calls]) {
            expect(data.domEvent).toBeInstanceOf(Event);
        }
    });

    it('回调数据的类型按运行时声明', () => {
        expectTypeOf<NavClickData['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
        expectTypeOf<NavClickData['text']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<NavClickData['openKeys']>().toEqualTypeOf<ItemKey[] | undefined>();
        expectTypeOf<OnSelectedData>().not.toHaveProperty('isOpen');
        expectTypeOf<SelectedData['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
        expectTypeOf<NavOpenChangeData['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
        expectTypeOf<OnSelectedData['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
    });

    it('点击水平子菜单标题只报告 onClick，展开状态由弹层决定', async () => {
        const onClick = onClickSpy();
        const onOpenChange = onOpenChangeSpy();
        renderJsx({ mode: 'horizontal', onClick, onOpenChange });
        await fireEvent.click(screen.getByText('用户'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'user', isOpen: false }));
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    // openKeysIsControlled requires vertical and expanded, so the popup keeps its hover trigger
    it('水平模式下，受控 openKeys 不驱动 popup', () => {
        renderJsx({ mode: 'horizontal', openKeys: ['user'] });
        expect(screen.queryByText('用户列表')).toBeNull();
    });

    it('折叠的顶层项以 tooltip 显示文本', async () => {
        useFakeTimers();
        renderJsx({ isCollapsed: true, tooltipShowDelay: 100 });
        await hover(getItemControl('首页'));
        await vi.advanceTimersByTimeAsync(99);
        expect(screen.getAllByText('首页')).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(screen.getAllByText('首页')).toHaveLength(2);
    });

    it('每个项都经过 #wrapper', () => {
        const wrapper = vi.fn<(props: NavWrapperSlotProps) => VNode>(({ itemElement, isSubNav, isInSubNav, props }) => (
            <div data-in={String(isInSubNav)} data-sub={String(isSubNav)} data-wrap={props.itemKey}>
                {itemElement}
            </div>
        ));
        renderJsx({ defaultOpenKeys: ['user'] }, { wrapper });
        const wrapped = [...document.querySelectorAll<HTMLElement>('[data-wrap]')].map((el) => [el.dataset.wrap, el.dataset.sub, el.dataset.in]);
        expect(wrapped).toEqual([
            ['home', 'false', 'false'],
            ['user', 'true', 'false'],
            ['list', 'false', 'true'],
            ['ban', 'false', 'true'],
            ['job', 'true', 'false'],
        ]);
        expect(document.querySelector('[data-wrap="list"] > li')).toHaveTextContent('用户列表');
    });

    it('仅在 limitIndent 为 false 时添加缩进占位', () => {
        const items = [{ itemKey: 'a', text: 'A', items: [{ itemKey: 'b', text: 'B', items: ['C'] }] }];
        const icons = (text: string) => (screen.getByText(text).closest(`.${prefixCls}-sub-title`) ?? getItem(text)).querySelectorAll(`.${prefixCls}-item-icon`).length;
        const view = renderNav({ defaultOpenKeys: ['a', 'b'], items });
        const limited = [icons('B'), icons('C')];
        view.unmount();
        renderNav({ defaultOpenKeys: ['a', 'b'], items, limitIndent: false });
        expect(limited).toEqual([2, 2]);
        expect([icons('B'), icons('C')]).toEqual([2, 3]);
    });

    it('通过 toggleIconPosition 把展开图标放在左侧', () => {
        renderJsx({ toggleIconPosition: 'left' });
        const inner = getSubTitle('用户').querySelector(`.${prefixCls}-item-inner`) as HTMLElement;
        expect(inner.firstElementChild).toHaveClass(`${prefixCls}-item-icon-toggle-left`);
    });

    it('Enter 与 Space 激活 popup 链接项时各点击一次内部链接并只报告一次', async () => {
        useFakeTimers();
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
        const onClick = onClickSpy();
        renderNav({ mode: 'horizontal', onClick }, () => (
            <SubNav itemKey="more" text="更多">
                {() => <NavItem itemKey="docs" link="#docs" text="文档" />}
            </SubNav>
        ));
        await hover(getSubTitle('更多'));
        await vi.advanceTimersByTimeAsync(100);
        expect(screen.getByText('文档').closest('a')).toHaveAttribute('tabindex', '-1');
        await fireEvent.keyDown(getItem('文档'), { key: 'Enter', code: 'Enter' });
        expect(click).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        await fireEvent.keyDown(getItem('文档'), { key: ' ', code: 'Space' });
        expect(click).toHaveBeenCalledTimes(2);
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('禁用的 popup 链接项按 Enter 不触发点击与内部链接', async () => {
        useFakeTimers();
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
        const onClick = onClickSpy();
        renderNav({ mode: 'horizontal', onClick }, () => (
            <SubNav itemKey="more" text="更多">
                {() => <NavItem disabled itemKey="docs" link="#docs" text="文档" />}
            </SubNav>
        ));
        await hover(getSubTitle('更多'));
        await vi.advanceTimersByTimeAsync(100);
        await fireEvent.keyDown(getItem('文档'), { key: 'Enter', code: 'Enter' });
        expect(click).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('data 属性透传到根节点与各项', () => {
        renderNav({ 'data-testid': 'nav' }, () => <NavItem data-item="home" itemKey="home" text="首页" />);
        expect(screen.getByTestId('nav')).toHaveClass(prefixCls);
        expect(getItem('首页')).toHaveAttribute('data-item', 'home');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', async () => {
        semiGlobal.config.overrideDefaultProps = { Nav: { mode: 'horizontal', toggleIconPosition: 'left' } };
        const view = renderJsx();
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-horizontal`);
        view.unmount();
        renderJsx({ mode: 'vertical' });
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-vertical`);
        const inner = getSubTitle('用户').querySelector(`.${prefixCls}-item-inner`) as HTMLElement;
        expect(inner.firstElementChild).toHaveClass(`${prefixCls}-item-icon-toggle-left`);
    });

    it('通过 semiGlobalKey 注入的实例只作用于该应用', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Nav: { mode: 'horizontal' } };
        render(Nav, { slots: { default: jsxChildren }, global: { provide: { [semiGlobalKey]: semi } } });
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-horizontal`);
        expect(semiGlobal.config.overrideDefaultProps).toEqual({});
    });

    describe('Sub 的 dropdownProps', () => {
        const popupOf = (text: string) => screen.getByText(text).closest('.semi-dropdown') as HTMLElement;
        const renderMore = (props: Record<string, unknown>, navProps: Record<string, unknown> = {}) =>
            renderNav({ mode: 'horizontal', ...navProps }, () => (
                <SubNav itemKey="more" text="更多" {...props}>
                    {() => <NavItem itemKey="docs" text="文档" />}
                </SubNav>
            ));

        it('dropdownProps.style 作用于弹层', async () => {
            useFakeTimers();
            renderMore({ dropdownProps: { style: { width: '200px' } } });
            await hover(getSubTitle('更多'));
            await vi.advanceTimersByTimeAsync(100);
            expect(popupOf('文档')).toHaveStyle({ width: '200px' });
        });

        it('Nav 的 subDropdownProps.style 作用于弹层', async () => {
            useFakeTimers();
            renderNav({ items: treeItems, mode: 'horizontal', subDropdownProps: { style: { width: '180px' } } });
            await hover(getSubTitle('用户'));
            await vi.advanceTimersByTimeAsync(100);
            expect(popupOf('用户列表')).toHaveStyle({ width: '180px' });
        });

        it('弹层里嵌套的 Sub 不带 -sub-wrap，内联的 Sub 带', async () => {
            useFakeTimers();
            renderNav({ mode: 'horizontal' }, () => (
                <SubNav itemKey="more" text="更多">
                    {() => (
                        <SubNav itemKey="inner" text="嵌套">
                            {() => <NavItem itemKey="docs" text="文档" />}
                        </SubNav>
                    )}
                </SubNav>
            ));
            await hover(getSubTitle('更多'));
            await vi.advanceTimersByTimeAsync(100);
            expect(getSubTitle('更多').closest('li')).toHaveClass(`${prefixCls}-sub-wrap`);
            expect(getSubTitle('嵌套').closest('li')).not.toHaveClass(`${prefixCls}-sub-wrap`);
        });

        it('dropdownStyle 优先于 dropdownProps.style，未给时不覆盖', async () => {
            useFakeTimers();
            const view = renderMore({
                dropdownProps: { style: { width: '200px' } },
                dropdownStyle: { width: '240px' },
            });
            await hover(getSubTitle('更多'));
            await vi.advanceTimersByTimeAsync(100);
            expect(popupOf('文档')).toHaveStyle({ width: '240px' });
            await unhover(getSubTitle('更多'));
            view.unmount();
            renderMore({ dropdownProps: { style: { width: '200px' } }, dropdownStyle: undefined });
            await hover(getSubTitle('更多'));
            await vi.advanceTimersByTimeAsync(100);
            expect(popupOf('文档')).toHaveStyle({ width: '200px' });
        });

        it('dropdownProps.trigger 为 click 时悬停不打开弹层', async () => {
            useFakeTimers();
            renderMore({ dropdownProps: { trigger: 'click' } });
            await hover(getSubTitle('更多'));
            await vi.advanceTimersByTimeAsync(300);
            expect(screen.queryByText('文档')).toBeNull();
        });

        it('使用方传入 onVisibleChange 时 openChange 仍触发', async () => {
            useFakeTimers();
            const onVisibleChange = vi.fn<(visible: boolean) => void>();
            const onOpenChange = onOpenChangeSpy();
            renderMore({ dropdownProps: { onVisibleChange } }, { onOpenChange });
            await hover(getSubTitle('更多'));
            await vi.advanceTimersByTimeAsync(200);
            expect(onVisibleChange).toHaveBeenCalledWith(true);
            expect(onOpenChange).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'more', isOpen: true }));
        });
    });
});

describe('Navigation 的属性落点与渲染时机', () => {
    it('受控 selectedKeys 变化后的下一次渲染就生效', async () => {
        const view = renderNav({ items: treeItems, openKeys: ['job'], selectedKeys: ['home'] });
        await view.rerender({ selectedKeys: ['query'] });
        expect(isSelected('任务查询')).toBe(true);
        expect(isSelected('首页')).toBe(false);
    });

    it('未知属性透传到根元素', () => {
        renderNav({ id: 'nav', 'aria-label': '主导航' }, () => (
            <>
                <NavHeader data-part="header" text="Semi" />
                <NavItem title="home page" itemKey="home" text="首页" />
                <SubNav data-sub="user" itemKey="user" text="用户">
                    {() => <NavItem itemKey="list" text="用户列表" />}
                </SubNav>
                <NavFooter data-part="footer" />
            </>
        ));
        const root = document.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('id', 'nav');
        expect(root).toHaveAttribute('aria-label', '主导航');
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveAttribute('data-part', 'header');
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveAttribute('data-part', 'footer');
        expect(getItem('首页')).toHaveAttribute('title', 'home page');
        expect(document.querySelector(`.${prefixCls}-item-sub`)).toHaveAttribute('data-sub', 'user');
    });

    it('非 DOM 属性的项配置字段不落到 DOM', () => {
        const warn = vi.spyOn(console, 'warn');
        renderNav({
            defaultOpenKeys: ['user'],
            items: ['首页', { itemKey: 'user', text: '用户', items: ['用户列表'] }],
        });
        for (const el of document.querySelectorAll(`.${prefixCls}-item`)) {
            expect(el).not.toHaveAttribute('items');
            expect(el).not.toHaveAttribute('level');
            expect(el).not.toHaveAttribute('itemkey');
        }
        expect(warn).not.toHaveBeenCalled();
    });

    it('未声明的项配置字段不落到 DOM，但 data-* 与 aria-* 会透传', () => {
        const warn = vi.spyOn(console, 'warn');
        // a variable rather than a literal: undeclared config fields are the input under test
        const items = [
            { itemKey: 'home', text: '首页', path: '/home', someCamelKey: 1, 'data-x': 'a', 'aria-describedby': 'tip' },
            {
                itemKey: 'user',
                text: '用户',
                path: '/user',
                someCamelKey: 2,
                'data-sub': 'b',
                items: [{ itemKey: 'list', text: '用户列表', path: '/list', someCamelKey: 3 }],
            },
        ];
        renderNav({ defaultOpenKeys: ['user'], items });
        for (const el of document.querySelectorAll(`.${prefixCls}-item`)) {
            expect(el).not.toHaveAttribute('path');
            expect(el).not.toHaveAttribute('somecamelkey');
        }
        expect(getItem('首页')).toHaveAttribute('data-x', 'a');
        expect(getItem('首页')).not.toHaveAttribute('aria-describedby');
        expect(getItemControl('首页')).toHaveAttribute('aria-describedby', 'tip');
        expect(document.querySelector(`.${prefixCls}-item-sub`)).toHaveAttribute('data-sub', 'b');
        expect(warn).not.toHaveBeenCalled();
    });

    it('子菜单的 aria-* 放在标题按钮上，而不是 li 上', () => {
        const items = [
            {
                itemKey: 'user',
                text: '用户',
                'aria-label': '用户菜单',
                'data-sub': 'b',
                items: [{ itemKey: 'list', text: '用户列表' }],
            },
        ];
        renderNav({ items });
        expect(getSubTitle('用户')).toBe(screen.getByRole('button', { name: '用户菜单' }));
        const li = document.querySelector(`.${prefixCls}-item-sub`);
        expect(li).not.toHaveAttribute('role');
        expect(li).not.toHaveAttribute('aria-label');
        expect(li).toHaveAttribute('data-sub', 'b');
    });

    it('组件实例的 $el 是根元素', () => {
        const navRef = ref<{ $el: Element }>();
        const itemRef = ref<{ $el: Element }>();
        const subRef = ref<{ $el: Element }>();
        render({
            render: () => (
                <Nav ref={navRef}>
                    {() => (
                        <>
                            <NavItem ref={itemRef} itemKey="home" text="首页" />
                            <SubNav ref={subRef} itemKey="user" text="用户">
                                {() => <NavItem itemKey="list" text="用户列表" />}
                            </SubNav>
                        </>
                    )}
                </Nav>
            ),
        });
        expect(navRef.value?.$el).toBe(document.querySelector(`.${prefixCls}`));
        expect(itemRef.value?.$el).toBe(getItem('首页'));
        expect(subRef.value?.$el).toBe(document.querySelector(`.${prefixCls}-item-sub`));
    });

    it('Item 的 aria-* 与 tabindex 落在按钮上，其余属性与监听落在 li 上', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        renderNav({}, () => (
            <>
                <NavItem aria-describedby="tip" class="own" data-x="a" id="home-item" tabindex={-1} title="home page" onMouseenter={onMouseenter} itemKey="home" text="首页" />
                <NavItem itemKey="docs" link="/docs" text="文档" aria-label="文档链接" />
            </>
        ));
        const li = getItem('首页');
        const button = getItemControl('首页');
        expect(button).toHaveAttribute('aria-describedby', 'tip');
        expect(button).toHaveAttribute('tabindex', '-1');
        expect(li).not.toHaveAttribute('tabindex');
        expect(li).toHaveAttribute('id', 'home-item');
        expect(li).toHaveAttribute('title', 'home page');
        expect(li).toHaveAttribute('data-x', 'a');
        expect(li).toHaveClass('own');
        expect(li).not.toHaveClass(`${prefixCls}-item-normal`);
        expect(getItem('文档')).toHaveClass(`${prefixCls}-item-normal`);
        expect(screen.getByRole('link', { name: '文档链接' })).toHaveAttribute('href', '/docs');
        await fireEvent.mouseEnter(li);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
    });

    it('popup 中的 Item 的 class 与 style 落在菜单项 li 上', async () => {
        useFakeTimers();
        renderNav({ mode: 'horizontal' }, () => (
            <SubNav itemKey="more" text="更多">
                {() => <NavItem class="own" itemKey="docs" style={{ color: 'red' }} text="文档" />}
            </SubNav>
        ));
        await hover(getSubTitle('更多'));
        await vi.advanceTimersByTimeAsync(100);
        const li = getItem('文档');
        expect(li).toHaveAttribute('role', 'menuitem');
        expect(li).toHaveClass('own');
        expect(li).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
});

describe('Navigation 的类名前缀', () => {
    it('根、列表、Item、Sub、Header、Footer 的类名前缀一致', () => {
        renderNav({ defaultOpenKeys: ['user'], footer: { collapseButton: true } }, () => (
            <>
                <NavHeader link="#" text="Semi">
                    {{
                        logo: () => <img alt="" />,
                    }}
                </NavHeader>
                <NavItem itemKey="home" link="#home" text="首页" />
                <NavItem itemKey="docs" text="文档" />
                <SubNav itemKey="user" text="用户">
                    {() => <NavItem itemKey="list" text="用户列表" />}
                </SubNav>
            </>
        ));
        const root = document.querySelector(`.${prefixCls}`) as HTMLElement;
        const suffixes = ['list-wrapper', 'list', 'item', 'item-link', 'item-button', 'item-text', 'item-sub', 'sub-title', 'sub', 'sub-wrap', 'header', 'header-link', 'header-logo', 'header-text', 'footer', 'collapse-btn'];
        expect(suffixes.filter((suffix) => !root.querySelector(`.${prefixCls}-${suffix}`))).toEqual([]);
        const stray = [...root.querySelectorAll('[class*="navigation"]')].flatMap((el) => [...el.classList]).filter((name) => name.includes('navigation') && !name.startsWith(prefixCls));
        expect(stray).toEqual([]);
    });
});

describe('Navigation 的 items 派生与项渲染', () => {
    it('itemKey 为 0 的项与 itemKey 为 "00" 的项不产生重复的 key', () => {
        const warn = vi.spyOn(console, 'warn');
        renderNav({
            items: [
                { itemKey: 0, text: 'a' },
                { itemKey: '00', text: 'b' },
            ],
        });
        expect(warn).not.toHaveBeenCalled();
        expect(screen.getByText('a')).toBeInTheDocument();
        expect(screen.getByText('b')).toBeInTheDocument();
    });

    it('items 变化后的下一次渲染就是新的项', async () => {
        const view = renderNav({ items: [{ itemKey: 'a', text: '旧项' }] });
        await view.rerender({ items: [{ itemKey: 'b', text: '新项' }] });
        expect(getList()).toHaveTextContent(/^新项$/);
    });

    it('Sub 的 Semi 图标保留自定义 size，非 Semi 元素不带 size 属性', () => {
        renderNav({}, () => (
            <>
                <SubNav itemKey="a" text="A">
                    {{
                        default: () => <NavItem itemKey="a1" text="A1" />,
                        icon: () => <IconHome data-testid="semi-icon" size="small" />,
                    }}
                </SubNav>
                <SubNav itemKey="b" text="B">
                    {{
                        default: () => <NavItem itemKey="b1" text="B1" />,
                        icon: () => <span data-testid="plain-icon" />,
                    }}
                </SubNav>
            </>
        ));
        expect(screen.getByTestId('semi-icon')).toHaveClass('semi-icon-small');
        expect(screen.getByTestId('plain-icon')).not.toHaveAttribute('size');
    });

    it('#wrapper 收到的 Sub 属性是 SubNav 自身的属性', () => {
        const received: unknown[] = [];
        render(Nav, {
            slots: {
                default: () => (
                    <SubNav itemKey="a" text="A">
                        {{
                            default: () => <NavItem itemKey="a1" text="A1" />,
                            expandIcon: () => <span data-testid="expand" />,
                            icon: () => <span data-testid="icon" />,
                        }}
                    </SubNav>
                ),
                wrapper: ({ itemElement, isSubNav, props }: NavWrapperSlotProps) => {
                    if (isSubNav) received.push({ ...props });
                    return itemElement;
                },
            },
        });
        expect(received).toEqual([expect.objectContaining({ itemKey: 'a', text: 'A' })]);
        expect(received[0]).not.toHaveProperty('icon');
        expect(received[0]).not.toHaveProperty('expandIcon');
    });

    it('先渲染 items 再渲染子项', () => {
        renderNav({ items: [{ itemKey: 'a', text: '数据项' }] }, () => <NavItem itemKey="b" text="子项" />);
        expect([...getList().children].map((li) => li.textContent)).toEqual(['数据项', '子项']);
    });
});

describe('Navigation 的 Tab 停留点', () => {
    it('折叠时，折叠按钮是唯一的 Tab 停留点，并由 tooltip 描述', async () => {
        renderEnglish(() => <Nav defaultIsCollapsed footer={{ collapseButton: true }} />);
        await userEvent.tab();
        const button = document.activeElement as HTMLElement;
        expect(button.tagName).toBe('BUTTON');
        await waitFor(() => expect(button).toHaveAccessibleDescription('Expand Sidebar'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Navigation 的 Vue 用法', () => {
    it('单向绑定不会自行改变', async () => {
        const onSelect = onSelectSpy();
        const onCollapseChange = onCollapseChangeSpy();
        renderJsx({
            footer: { collapseButton: true },
            isCollapsed: false,
            openKeys: [],
            selectedKeys: ['home'],
            onSelect,
            onCollapseChange,
        });
        await userEvent.click(getSubTitle('任务'));
        expect(isOpen('任务')).toBe(false);
        await userEvent.click(getItemControl('首页'));
        await userEvent.click(getSubTitle('用户'));
        expect(isOpen('用户')).toBe(false);
        expect(isSelected('首页')).toBe(true);
        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledWith(true);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-collapsed`);
    });

    it('受控的 isCollapsed 变回 undefined 时回到内部状态', async () => {
        const view = renderJsx({ isCollapsed: true });
        const root = document.querySelector(`.${prefixCls}`) as HTMLElement;
        expect(root).toHaveClass(`${prefixCls}-collapsed`);
        await view.rerender({ isCollapsed: false });
        expect(root).not.toHaveClass(`${prefixCls}-collapsed`);
        await view.rerender({ isCollapsed: undefined });
        expect(root).toHaveClass(`${prefixCls}-collapsed`);
    });

    it('全局默认的 subNavOpenDelay 生效', async () => {
        useFakeTimers();
        semiGlobal.config.overrideDefaultProps = { Nav: { subNavOpenDelay: 200 } };
        renderJsx({ isCollapsed: true });
        await hover(getSubTitle('用户'));
        await vi.advanceTimersByTimeAsync(199);
        expect(screen.queryByText('用户列表')).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        expect(screen.getByText('用户列表')).toBeInTheDocument();
    });

    it('Nav 的 #icon、#text、#toggleIcon、#expandIcon 以 { item, level } 渲染每个数据项', () => {
        const levels: [ItemKey | undefined, number][] = [];
        const view = render(Nav, {
            props: { defaultOpenKeys: ['user'], items: treeItems },
            slots: {
                icon: ({ item }: { item: NavItemConfig }) => <span data-icon={item.itemKey} />,
                text: ({ item, level }: { item: NavItemConfig; level: number }) => {
                    levels.push([item.itemKey, level]);
                    return `${item.text}@${level}`;
                },
                toggleIcon: ({ item }: { item: NavItemConfig }) => <span data-toggle={item.itemKey} />,
                expandIcon: ({ item }: { item: NavItemConfig }) => <span data-expand={item.itemKey} />,
            },
        });
        const nav = view.container.querySelector(`.${prefixCls}`) as HTMLElement;
        expect(nav).toHaveTextContent('首页@0');
        expect(nav).toHaveTextContent('用户列表@1');
        expect(levels).toContainEqual(['ban', 1]);
        expect(nav.querySelector('[data-icon="list"]')).not.toBeNull();
        expect(nav.querySelector('[data-toggle="home"]')).not.toBeNull();
        expect(nav.querySelector('[data-expand="user"]')).not.toBeNull();
    });

    it('NavItem 的 #text 优先于 text，tooltip 内容同样取插槽', async () => {
        useFakeTimers();
        renderNav({ isCollapsed: true }, () => (
            <NavItem itemKey="home" text="首页">
                {{
                    text: () => '插槽首页',
                    icon: () => <span>i</span>,
                }}
            </NavItem>
        ));
        expect(screen.queryByText('首页')).toBeNull();
        await hover(getItemControl('插槽首页'));
        await vi.advanceTimersByTimeAsync(100);
        expect(screen.getAllByText('插槽首页')).toHaveLength(2);
    });

    it('SubNav 的 #text、#icon、#expandIcon 与 NavHeader 的 #logo、#text', () => {
        renderNav({}, () => (
            <>
                <NavHeader text="标题">
                    {{
                        logo: () => <img alt="logo" />,
                        text: () => '插槽标题',
                    }}
                </NavHeader>
                <SubNav itemKey="user" text="用户">
                    {{
                        default: () => <NavItem itemKey="list" text="用户列表" />,
                        expandIcon: () => <span data-testid="expand" />,
                        icon: () => <span data-testid="icon" />,
                        text: () => '插槽用户',
                    }}
                </SubNav>
            </>
        ));
        expect(document.querySelector(`.${prefixCls}-header-logo img`)).toHaveAttribute('alt', 'logo');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('插槽标题');
        const title = screen.getByRole('button', { name: '插槽用户' });
        expect(title).toContainElement(screen.getByTestId('expand'));
        expect(title).toContainElement(screen.getByTestId('icon'));
    });

    it('#collapseText 只含文本时命名折叠按钮，含元素时回落到语言包文案', () => {
        renderEnglish(() => <Nav isCollapsed>{() => <NavFooter collapseButton>{{ collapseText: () => '展开' }}</NavFooter>}</Nav>);
        expect(getCollapseButton()).toHaveAccessibleName('展开');
        document.body.innerHTML = '';
        renderEnglish(() => (
            <Nav isCollapsed>
                {() => (
                    <NavFooter collapseButton>
                        {{
                            collapseText: () => <b>展开</b>,
                        }}
                    </NavFooter>
                )}
            </Nav>
        ));
        expect(getCollapseButton()).toHaveAccessibleName('Expand Sidebar');
    });

    it('Footer 有内容时显示内容而不显示折叠按钮', () => {
        renderNav({}, () => <NavFooter collapseButton>{() => '版权所有'}</NavFooter>);
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveTextContent('版权所有');
        expect(getCollapseButton()).toBeNull();
    });

    it('折叠时 header 链接仍有可访问名称', () => {
        renderNav({ header: { link: '/home', text: 'Semi' }, isCollapsed: true });
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveAttribute('href', '/home');
    });

    it('Nav 的 click 遮住根元素的原生 click', async () => {
        const onClick = onClickSpy();
        renderNav({ onClick }, () => (
            <>
                <NavItem itemKey="home" text="首页" />
                <span>其他内容</span>
            </>
        ));
        await userEvent.click(screen.getByText('其他内容'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('一次点击中每个事件只触发一次', async () => {
        const onClick = onClickSpy();
        const onSelect = onSelectSpy();
        const onItemClick = vi.fn<(data: SelectedData) => void>();
        const onFooterClick = vi.fn<(event: MouseEvent) => void>();
        renderNav({ onClick, onSelect }, () => (
            <>
                <NavItem itemKey="home" text="首页" onClick={onItemClick} />
                <NavFooter onClick={onFooterClick}>{() => '版权所有'}</NavFooter>
            </>
        ));
        await userEvent.click(getItemControl('首页'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onItemClick).toHaveBeenCalledTimes(1);
        expect(onItemClick.mock.calls[0][0]).toEqual({
            itemKey: 'home',
            text: '首页',
            domEvent: expect.any(MouseEvent),
        });
        await userEvent.click(screen.getByText('版权所有'));
        expect(onFooterClick).toHaveBeenCalledTimes(1);
    });

    it('select 的 selectedItems 不含未设置的字段与内部字段', async () => {
        const onSelect = onSelectSpy();
        renderNav({ onSelect }, () => <NavItem itemKey="home" text="首页" />);
        await userEvent.click(getItemControl('首页'));
        const [item] = onSelect.mock.calls[0][0].selectedItems;
        expect(item).toEqual({ itemKey: 'home', text: '首页' });
    });

    it('#wrapper 的 props 只含传入的字段', () => {
        const received: unknown[] = [];
        render(Nav, {
            slots: {
                default: () => (
                    <>
                        <NavItem itemKey="home" text="首页" />
                        <SubNav itemKey="a" text="A" />
                    </>
                ),
                wrapper: ({ itemElement, props }: NavWrapperSlotProps) => {
                    received.push(props);
                    return itemElement;
                },
            },
        });
        expect(received).toEqual(
            expect.arrayContaining([
                { itemKey: 'home', text: '首页' },
                { itemKey: 'a', text: 'A' },
            ])
        );
    });

    it('类型含 Boolean 的属性未传时不被转成 false', () => {
        const received: Record<string, unknown>[] = [];
        render(Nav, {
            props: {
                items: [
                    { itemKey: 'home', text: '首页' },
                    { itemKey: 'a', text: 'A', items: [{ itemKey: 'b', text: 'B' }] },
                ],
            },
            slots: {
                wrapper: ({ itemElement, props }: NavWrapperSlotProps) => {
                    received.push(props as Record<string, unknown>);
                    return itemElement;
                },
            },
        });
        expect(received.length).toBeGreaterThan(0);
        for (const props of received) {
            expect(props).not.toHaveProperty('disabled');
            expect(props).not.toHaveProperty('indent');
            expect(props).not.toHaveProperty('isCollapsed');
            expect(props).not.toHaveProperty('dropdownStyle');
        }
    });

    it('模板写法收集 v-for、v-if 与 template 包裹的子项', async () => {
        const warn = vi.spyOn(console, 'warn');
        const keys = reactive(['k']);
        const view = render(Collect, { props: { keys, defaultSelectedKeys: ['group-item-k'] } });
        expect(isOpen('分组 k')).toBe(true);
        keys.push('w');
        await nextTick();
        expect(screen.getByText('子菜单 w')).toBeInTheDocument();
        expect(screen.getByText('分组 w')).toBeInTheDocument();
        await view.rerender({ keys: ['k'], selectedKeys: ['k'] });
        expect(isOpen('子菜单 k')).toBe(true);
        expect(getItemControl('禁用项')).toHaveAttribute('aria-disabled', 'true');
        await view.rerender({ selectedKeys: ['wrapped'] });
        expect(isOpen('包装')).toBe(false);
        await userEvent.click(getSubTitle('包装'));
        expect(isSelected('包装项')).toBe(true);

        await view.rerender({ extra: true, selectedKeys: ['extra-item'] });
        expect(isOpen('额外')).toBe(true);
        await view.rerender({ nested: true, selectedKeys: ['added'] });
        expect(isOpen('用户')).toBe(true);
        await view.rerender({ extra: false });
        expect(screen.queryByText('额外')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('透传 itemKey 的包装组件参与首次渲染的祖先展开与顶层选中，位于顶层时直接进入列表', () => {
        const WrappedItem = (props: Record<string, unknown>) => <NavItem {...props} />;
        render({
            render: () => (
                <Nav defaultSelectedKeys={['inner']}>
                    {() => [
                        <SubNav itemKey="s" text="外层">
                            {() => (
                                <SubNav itemKey="t" text="内层">
                                    {() => <WrappedItem itemKey="inner" text="包装项" />}
                                </SubNav>
                            )}
                        </SubNav>,
                        <WrappedItem itemKey="top" text="顶层包装项" />,
                    ]}
                </Nav>
            ),
        });
        expect(isOpen('外层')).toBe(true);
        expect(isOpen('内层')).toBe(true);
        expect(getSubTitle('外层')).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(document.querySelector(`.${prefixCls}-list-extra`)).toBeNull();
    });

    it('包装 Nav.Sub 的组件不读取其子项，默认选中项不展开它', () => {
        const WrappedSub = (props: Record<string, unknown>, { slots }: { slots: Record<string, () => VNode[]> }) => <SubNav {...props}>{slots}</SubNav>;
        render({
            render: () => (
                <Nav defaultSelectedKeys={['inner']}>
                    {() => (
                        <WrappedSub itemKey="s" text="包装">
                            {() => <NavItem itemKey="inner" text="包装项" />}
                        </WrappedSub>
                    )}
                </Nav>
            ),
        });
        expect(isOpen('包装')).toBe(false);
        expect(document.querySelector(`.${prefixCls}-list-extra`)).toBeNull();
    });

    it('带 itemKey 的包装组件使用作用域默认插槽时照常渲染', () => {
        const LinkItem = defineComponent({
            props: { itemKey: String, text: String },
            setup(props, { slots }) {
                return () => (
                    <NavItem itemKey={props.itemKey} text={props.text}>
                        {{ icon: () => slots.default?.({ active: true }) }}
                    </NavItem>
                );
            },
        });
        render({
            render: () => (
                <Nav>
                    {() => (
                        <LinkItem itemKey="a" text="链接">
                            {{ default: ({ active }: { active: boolean }) => <span>{active ? '当前' : '其他'}</span> }}
                        </LinkItem>
                    )}
                </Nav>
            ),
        });
        expect(screen.getByText('链接')).toBeInTheDocument();
        expect(screen.getByText('当前')).toBeInTheDocument();
    });

    it('h() 写法增删子项，kebab-case 的 key 与布尔简写都被识别', async () => {
        const warn = vi.spyOn(console, 'warn');
        const state = reactive({ extra: false, selectedKeys: ['list'] as ItemKey[] });
        const shorthand: Record<string, unknown> = { disabled: '' };
        render({
            render: () => (
                <Nav selectedKeys={state.selectedKeys}>
                    {() => [
                        <SubNav item-key="user" text="用户">
                            {() => <NavItem item-key="list" text="用户列表" />}
                        </SubNav>,
                        state.extra ? (
                            <SubNav itemKey="extra" text="额外">
                                {() => <NavItem itemKey="extra-item" text="额外项" />}
                            </SubNav>
                        ) : null,
                        <NavItem {...shorthand} itemKey="off" text="禁用项" />,
                    ]}
                </Nav>
            ),
        });
        expect(isOpen('用户')).toBe(true);
        expect(getItemControl('禁用项')).toHaveAttribute('aria-disabled', 'true');
        state.extra = true;
        state.selectedKeys = ['extra-item'];
        await nextTick();
        expect(isOpen('额外')).toBe(true);
        state.extra = false;
        await nextTick();
        expect(screen.queryByText('额外')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('折叠只改内部状态，每次更新只为渲染列表读一次 h() 写的默认插槽', async () => {
        let slotCalls = 0;
        let updates = 0;
        const slots = {
            default: () => {
                slotCalls += 1;
                return (
                    <>
                        <NavItem itemKey="a" text="甲" />
                        <NavItem itemKey="b" text="乙" />
                    </>
                );
            },
        };
        render(
            defineComponent(() => () => (
                <Nav footer={{ collapseButton: true }} onVnodeUpdated={() => (updates += 1)}>
                    {slots}
                </Nav>
            ))
        );
        slotCalls = 0;
        await userEvent.click(getCollapseButton());
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-collapsed`);
        expect(updates).toBeGreaterThan(0);
        expect(slotCalls).toBe(updates);
    });

    it('h() 子项在父组件 render 中构建，增删 Sub 与 Item 后展开映射随之更新', async () => {
        const state = reactive({ extra: false, selectedKeys: ['list'] as ItemKey[] });
        render({
            render: () => {
                // built outside the slot function, so the slot reads no reactive value
                const children = [
                    <SubNav itemKey="user" text="用户">
                        {() => <NavItem itemKey="list" text="用户列表" />}
                    </SubNav>,
                    ...(state.extra
                        ? [
                              <SubNav itemKey="extra" text="额外">
                                  {() => <NavItem itemKey="extra-item" text="额外项" />}
                              </SubNav>,
                          ]
                        : []),
                ];
                return <Nav selectedKeys={state.selectedKeys}>{{ default: () => children }}</Nav>;
            },
        });
        expect(isOpen('用户')).toBe(true);
        state.extra = true;
        state.selectedKeys = ['extra-item'];
        await nextTick();
        expect(isOpen('额外')).toBe(true);
        expect(getSubTitle('额外')).toHaveClass(`${prefixCls}-sub-title-selected`);
        state.extra = false;
        await nextTick();
        expect(screen.queryByText('额外')).toBeNull();
    });

    it('一次渲染只读取一次默认插槽的布局，加收集子项共两次', async () => {
        const slot = vi.fn<typeof jsxChildren>(jsxChildren);
        const view = render(Nav, { props: { defaultSelectedKeys: ['home'] }, slots: { default: slot } });
        expect(slot).toHaveBeenCalledTimes(2);
        slot.mockClear();
        await view.rerender({ defaultSelectedKeys: ['home'], mode: 'horizontal' });
        expect(slot).toHaveBeenCalledTimes(2);
    });

    it('只有一个 Sub 子项时，默认选中项的父级展开', () => {
        renderNav({ defaultSelectedKeys: ['list'] }, () => (
            <SubNav itemKey="user" text="用户">
                {() => <NavItem itemKey="list" text="用户列表" />}
            </SubNav>
        ));
        expect(isOpen('用户')).toBe(true);
    });

    it('父组件因无关状态重新渲染时，不重置非受控的选中与展开', async () => {
        const count = ref(0);
        render({
            render: () => (
                <>
                    <button type="button" onClick={() => count.value++}>{`rerender ${count.value}`}</button>
                    <Nav defaultSelectedKeys={['home']}>{jsxChildren}</Nav>
                </>
            ),
        });
        await userEvent.click(getSubTitle('任务'));
        await userEvent.click(getItemControl('任务查询'));
        expect(isSelected('任务查询')).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'rerender 0' }));
        expect(screen.getByRole('button', { name: 'rerender 1' })).toBeInTheDocument();
        expect(isSelected('任务查询')).toBe(true);
        expect(isSelected('首页')).toBe(false);
        expect(isOpen('任务')).toBe(true);
    });

    it('服务端渲染时默认选中项的祖先展开，顶层父级标记为选中', async () => {
        const html = await renderToString(createSSRApp({ render: () => <SsrNav defaultSelectedKeys={['query']} /> }));
        const container = document.createElement('div');
        container.innerHTML = html;
        const title = [...container.querySelectorAll(`.${prefixCls}-sub-title`)].find((el) => el.textContent?.includes('任务管理'));
        expect(title).toHaveAttribute('aria-expanded', 'true');
        expect(title).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(html).toContain('任务查询');
    });

    it('KeepAlive 切走再切回后 popup 已关闭', async () => {
        useFakeTimers();
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => <Nav mode="horizontal">{jsxChildren}</Nav>,
        });
        const cached = shallowRef(true);
        render({
            render: () => (
                <KeepAlive>
                    {{
                        default: () => (cached.value ? <Cached /> : <p>other</p>),
                    }}
                </KeepAlive>
            ),
        });
        await hover(getSubTitle('用户'));
        await vi.advanceTimersByTimeAsync(200);
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(getSubTitle('用户')).toHaveAttribute('aria-expanded', 'true');
        await unhover(getSubTitle('用户'));
        cached.value = false;
        await nextTick();
        cached.value = true;
        await nextTick();
        expect(screen.queryByRole('menu')).toBeNull();
        expect(getSubTitle('用户')).toHaveAttribute('aria-expanded', 'false');
    });

    it('模板 fixture 渲染时不产生警告', async () => {
        const warn = vi.spyOn(console, 'warn');
        const onSelect = onSelectSpy();
        render(JsxNav, { props: { defaultSelectedKeys: ['ban'], onSelect } });
        expect(isOpen('用户')).toBe(true);
        expect(isSelected('用户封禁')).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: '首页' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(isSelected('首页')).toBe(true);
        expect(warn).not.toHaveBeenCalled();
    });

    it('应用注册了 Button 后，Item 与 Sub 的标题仍是原生 button', () => {
        render(Nav, { global: { components: { Button } }, props: { defaultOpenKeys: ['user'], items: treeItems } });
        for (const text of ['首页', '用户']) {
            const control = getItemControl(text);
            expect(control.tagName).toBe('BUTTON');
            expect(control).not.toHaveClass('semi-button');
        }
    });

    it('应用注册同名 NavItems 后，库内部的递归渲染不变', () => {
        const NavItems = defineComponent({ name: 'NavItems', render: () => <i class="stub" /> });
        render(Nav, { global: { components: { NavItems } }, props: { defaultOpenKeys: ['user'], items: treeItems } });
        expect(document.querySelector('.stub')).toBeNull();
        expect(screen.getByText('用户列表')).toBeInTheDocument();
    });

    it('折叠按钮按 Enter 展开与收起后仍是同一个按钮并持有焦点', async () => {
        renderNav({ footer: { collapseButton: true }, items: treeItems });
        const button = getCollapseButton();
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(getCollapseButton()).toBe(button);
        expect(button).toHaveFocus();
        expect(button).toHaveAccessibleName('展开侧边栏');
        await userEvent.keyboard('{Enter}');
        expect(getCollapseButton()).toBe(button);
        expect(button).toHaveFocus();
    });

    it('受控的 isCollapsed 外部切换时，顶层项与 Sub 标题保持焦点', async () => {
        const state = reactive({ isCollapsed: false });
        render({ render: () => <Nav isCollapsed={state.isCollapsed}>{jsxChildren}</Nav> });
        const control = getItemControl('首页');
        control.focus();
        state.isCollapsed = true;
        await nextTick();
        expect(control.isConnected).toBe(true);
        expect(control).toHaveFocus();

        state.isCollapsed = false;
        await nextTick();
        getSubTitle('用户').focus();
        state.isCollapsed = true;
        await nextTick();
        await nextTick();
        expect(document.activeElement?.closest(`.${prefixCls}-sub-title`)).toHaveTextContent('用户');
        state.isCollapsed = false;
        await nextTick();
        await nextTick();
        expect(document.activeElement?.closest(`.${prefixCls}-sub-title`)).toHaveTextContent('用户');
    });

    it('Header 的 linkOptions.class 追加到内置链接类名', () => {
        renderNav({ header: { link: '/', text: 'Semi', linkOptions: { class: 'mine-header' } } });
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveClass('mine-header', `${prefixCls}-header-link`);
    });

    it('内联 Sub 收起时，标题不指向已卸载的列表', async () => {
        renderJsx();
        const title = getSubTitle('用户');
        expect(title).not.toHaveAttribute('aria-controls');
        await userEvent.click(title);
        const listId = title.getAttribute('aria-controls');
        expect(listId).toBeTruthy();
        expect(document.getElementById(listId as string)).not.toBeNull();
    });

    it('NavItem 收到 content 插槽时不转发给内部结构', () => {
        const view = render(Nav, {
            slots: {
                default: () => (
                    <NavItem itemKey="a" text="A">
                        {{ content: () => 'CONTENT', text: () => 'T' }}
                    </NavItem>
                ),
            },
        });
        expect(view.container.textContent).not.toContain('CONTENT');
        expect(view.container.textContent).toContain('T');
    });
});
