import { Profiler, StrictMode, useState, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconHome } from '@fibrae/semi-icons-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { DropdownProps } from '@fibrae/semi-ui-react/dropdown';
import Nav, { type ItemKey, type NavFooterProps, type NavItemProps, type NavProps, type OnSelectedData } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-navigation`;
const logo = 'https://example.com/webcast_logo.svg';

const getList = () => document.querySelector(`.${prefixCls} .${prefixCls}-list`);
const getOpenSubs = () => document.querySelectorAll(`.${prefixCls}-item-sub .${prefixCls}-sub-open`);
const getCollapseButton = () => document.querySelector<HTMLButtonElement>(`.${prefixCls}-footer .${prefixCls}-collapse-btn button`);
const getSubTitle = (text) => screen.getByText(text).closest<HTMLElement>(`.${prefixCls}-sub-title`);

describe(`Navigation`, () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it(`外观`, async () => {
        const items = [
            { itemKey: 'user', text: '用户管理' },
            { itemKey: 'union', text: '公会中心' },
            {
                itemKey: 'union-management',
                text: '公会管理',
                items: ['公告设置', '公会查询', '信息录入'],
            },
            {
                text: '任务平台',
                itemKey: 'job',
                items: ['任务管理', '用户任务查询'],
            },
        ];

        render(
            <Nav
                bodyStyle={{ height: 320 }}
                defaultOpenKeys={['job']}
                footer={{
                    collapseButton: true,
                }}
                header={{
                    logo: <img alt="" src={logo} />,
                    text: 'Semi 运营后台',
                }}
                items={items}
            />
        );

        expect(document.querySelector(`.${prefixCls}-header-logo img`)).toHaveAttribute('src', logo);
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(getOpenSubs()).toHaveLength(1);
        expect(getOpenSubs()[0]).toHaveTextContent('任务管理用户任务查询');
        expect(getSubTitle('任务平台')).toHaveAttribute('aria-expanded', 'true');
        expect(getSubTitle('公会管理')).toHaveAttribute('aria-expanded', 'false');
        expect(getList().children).toHaveLength(items.length);
        expect(getCollapseButton()).not.toBeNull();
    });

    it(`使用 JSX 定义的外观`, async () => {
        const defaultOpenKeys = ['user'];
        render(
            <Nav bodyStyle={{ height: 320 }} defaultOpenKeys={defaultOpenKeys}>
                <Nav.Header logo="bytedance_logo" text="Semi 运营后台" />
                <Nav.Item itemKey="union" text="公会中心" icon="star" />
                <Nav.Sub itemKey="user" text="用户管理" icon="user">
                    <Nav.Item itemKey="golder" text="金主管理" />
                    <Nav.Item itemKey="ban" text="用户封禁" />
                </Nav.Sub>
                <Nav.Sub itemKey="union-management" text="公会管理" icon="user_group">
                    <Nav.Item itemKey="notice" text="公告设置" />
                    <Nav.Item itemKey="query" text="公会查询" />
                    <Nav.Item itemKey="info" text="信息录入" />
                </Nav.Sub>
                <Nav.Footer collapseButton />
            </Nav>
        );

        expect(document.querySelector(`.${prefixCls}-header-logo`)).toHaveTextContent('bytedance_logo');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(getOpenSubs()).toHaveLength(1);
        expect(getOpenSubs()[0]).toHaveTextContent('金主管理用户封禁');
        expect(getList().children).toHaveLength(3);
        expect(getCollapseButton()).not.toBeNull();
    });

    it(`水平导航外观`, async () => {
        const items = [
            { itemKey: 'user', text: '用户管理' },
            { itemKey: 'union', text: '公会中心' },
            {
                itemKey: 'approve-management',
                text: '审批管理',
                items: [
                    '入驻审核',
                    {
                        itemKey: 'operation-management',
                        text: '运营管理',
                        items: ['人员管理', '人员变更'],
                    },
                ],
            },
            {
                text: '任务平台',
                itemKey: 'job',
                items: ['任务管理', '用户任务查询'],
            },
        ];

        render(
            <Nav
                footer={{ collapseButton: true }}
                header={{
                    logo: 'bytedance_logo',
                    text: 'Semi 运营后台',
                }}
                items={items}
                mode="horizontal"
                onClick={vi.fn<NonNullable<NavProps['onClick']>>()}
                onSelect={vi.fn<NonNullable<NavProps['onSelect']>>()}
            />
        );

        expect(document.querySelector(`.${prefixCls}-header-logo`)).toHaveTextContent('bytedance_logo');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
        expect(document.querySelectorAll(`.${prefixCls}-item-sub`)).toHaveLength(2);
        expect(getList().children).toHaveLength(items.length);
        expect(document.querySelector(`.${prefixCls}-footer .${prefixCls}-collapse-btn`)).toBeNull();
    });

    it(`受控的 selected 与 open`, async () => {
        const items = [
            { itemKey: 'user', text: '用户管理', icon: 'user' },
            { itemKey: 'union', text: '公会中心', icon: 'star' },
            {
                itemKey: 'union-management',
                text: '公会管理',
                icon: 'user_group',
                items: ['公告设置', '公会查询', '信息录入'],
            },
            {
                text: '任务平台',
                icon: 'setting',
                itemKey: 'job',
                items: ['任务管理', '用户任务查询'],
            },
        ];

        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const onCollapseChange = vi.fn<NonNullable<NavProps['onCollapseChange']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();

        function Controlled() {
            const [openKeys, setOpenKeys] = useState<ItemKey[]>(['union-management', 'job']);
            const [selectedKeys, setSelectedKeys] = useState<ItemKey[]>(['用户任务查询']);
            const [isCollapsed, setIsCollapsed] = useState(false);
            return (
                <Nav
                    bodyStyle={{ height: 320 }}
                    footer={{
                        collapseButton: true,
                    }}
                    header={{
                        logo: <img alt="" src={logo} />,
                        text: 'Semi 运营后台',
                    }}
                    isCollapsed={isCollapsed}
                    items={items}
                    openKeys={openKeys}
                    selectedKeys={selectedKeys}
                    onClick={onClick}
                    onCollapseChange={(collapsed) => {
                        onCollapseChange(collapsed);
                        setIsCollapsed(collapsed);
                    }}
                    onOpenChange={(data) => {
                        onOpenChange(data);
                        setOpenKeys(data.openKeys);
                    }}
                    onSelect={(data) => {
                        onSelect(data);
                        setSelectedKeys(data.selectedKeys);
                    }}
                />
            );
        }
        render(<Controlled />);
        expect(getSubTitle('公会管理')).toHaveAttribute('aria-expanded', 'true');
        expect(getSubTitle('任务平台')).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('用户任务查询').closest(`.${prefixCls}-item`)).toHaveClass(`${prefixCls}-item-selected`);

        await userEvent.click(getSubTitle('公会管理'));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange.mock.calls[0][0].openKeys).toEqual(['job']);
        expect(getSubTitle('公会管理')).toHaveAttribute('aria-expanded', 'false');
        expect(getSubTitle('任务平台')).toHaveAttribute('aria-expanded', 'true');

        await userEvent.click(screen.getByRole('button', { name: '任务管理' }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].selectedKeys).toEqual(['任务管理']);
        expect(screen.getByText('任务管理').closest(`.${prefixCls}-item`)).toHaveClass(`${prefixCls}-item-selected`);
        expect(screen.getByText('用户任务查询').closest(`.${prefixCls}-item`)).not.toHaveClass(`${prefixCls}-item-selected`);

        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledWith(true);
        expect(document.querySelectorAll(`.${prefixCls}-collapsed`)).toHaveLength(1);
    });

    it(`函数调用参数`, async () => {
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const onCollapseChange = vi.fn<NonNullable<NavProps['onCollapseChange']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();

        render(
            <Nav
                bodyStyle={{ height: 320 }}
                footer={{
                    collapseButton: true,
                }}
                items={[
                    { itemKey: 'user', text: '用户管理', icon: 'user' },
                    { itemKey: 'union', text: '公会中心', icon: 'star' },
                    {
                        text: '任务平台',
                        icon: 'setting',
                        itemKey: 'job',
                        items: ['任务管理', '用户任务查询'],
                    },
                ]}
                onClick={onClick}
                onCollapseChange={onCollapseChange}
                onOpenChange={onOpenChange}
                onSelect={onSelect}
            />
        );

        await userEvent.click(document.querySelector(`.${prefixCls}-sub-title`));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].itemKey).toEqual('job');
        expect(onOpenChange.mock.calls[0][0].itemKey).toEqual('job');

        await userEvent.click(document.querySelector(`.${prefixCls}-item-button`));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].itemKey).toEqual('user');

        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledTimes(1);
        expect(onCollapseChange).toHaveBeenCalledWith(true);
    });

    it(`itemKey 为数字类型时的展开`, async () => {
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();

        render(
            <Nav
                bodyStyle={{ height: 320 }}
                footer={{
                    collapseButton: true,
                }}
                items={[
                    { itemKey: 'user', text: '用户管理', icon: 'user' },
                    { itemKey: 'union', text: '公会中心', icon: 'star' },
                    {
                        text: '任务平台',
                        icon: 'setting',
                        itemKey: 2,
                        items: ['任务管理', '用户任务查询'],
                    },
                ]}
                onClick={onClick}
                onCollapseChange={vi.fn<NonNullable<NavProps['onCollapseChange']>>()}
                onOpenChange={onOpenChange}
                onSelect={vi.fn<NonNullable<NavProps['onSelect']>>()}
            />
        );

        expect(getOpenSubs()).toHaveLength(0);
        await userEvent.click(document.querySelector(`.${prefixCls}-sub-title`));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].itemKey).toEqual(2);
        expect(onOpenChange.mock.calls[0][0].itemKey).toEqual(2);
        expect(getOpenSubs()).toHaveLength(1);
        expect(getOpenSubs()[0]).toHaveTextContent('任务管理用户任务查询');
    });

    // APG disclosure navigation: a nav landmark with plain nested lists; items are links or buttons, a sub title is a
    // button that discloses its list
    it('暴露 disclosure 导航结构', () => {
        render(
            <Nav aria-label="主导航" defaultOpenKeys={['user']} defaultSelectedKeys={['list']}>
                <Nav.Sub itemKey="user" text="用户管理">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Item itemKey="docs" link="/docs" text="文档" />
                <span>其他内容</span>
            </Nav>
        );
        expect(screen.getByRole('navigation', { name: '主导航' })).toHaveClass(prefixCls);
        expect(screen.queryByRole('menu')).toBeNull();
        expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
        expect(screen.queryByRole('group')).toBeNull();

        const title = screen.getByRole('button', { name: '用户管理' });
        expect(title).toHaveClass(`${prefixCls}-sub-title`);
        expect(title).toHaveAttribute('aria-expanded', 'true');
        const subList = document.getElementById(title.getAttribute('aria-controls'));
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
        expect(screen.getByText('其他内容').parentElement.parentElement).toBe(getList());
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });

    it('Tab 可到达每个项与子标题，且只到达这些', async () => {
        render(
            <Nav defaultOpenKeys={['user']}>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Sub itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
                <Nav.Item itemKey="docs" link="/docs" text="文档" />
                <Nav.Sub itemKey="job" text="任务">
                    <Nav.Item itemKey="query" text="任务查询" />
                </Nav.Sub>
            </Nav>
        );
        const stops = [];
        await userEvent.tab();
        while (document.activeElement !== document.body) {
            stops.push(`${document.activeElement.tagName} ${document.activeElement.textContent}`);
            await userEvent.tab();
        }
        expect(stops).toEqual(['BUTTON 首页', 'BUTTON 用户', 'BUTTON 用户列表', 'A 文档', 'BUTTON 任务']);
    });

    it('Enter 与 Space 激活项并切换子菜单', async () => {
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(<JsxNav onOpenChange={onOpenChange} onSelect={onSelect} />);
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
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        render(<JsxNav mode="horizontal" />);
        const title = screen.getByRole('button', { name: '用户' });
        expect(title).toHaveAttribute('aria-haspopup', 'menu');
        expect(title).toHaveAttribute('aria-expanded', 'false');
        expect(title).not.toHaveAttribute('aria-controls');
        // a hover trigger also opens on focus; the popup reports visible after its positioning fallback
        act(() => title.focus());
        void act(() => vi.advanceTimersByTime(0));
        expect(screen.getByRole('menu')).toHaveTextContent('用户列表');
        await act(() => vi.advanceTimersByTimeAsync(500));
        expect(title).toHaveAttribute('aria-expanded', 'true');
        vi.useRealTimers();
    });

    it('popup 子菜单标题上的 Enter 与 Space 只报告一次', async () => {
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        render(<JsxNav mode="horizontal" onClick={onClick} />);
        screen.getByRole('button', { name: '用户' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('折叠时，顶层项的焦点目标是其按钮，由 tooltip 描述', async () => {
        render(<JsxNav isCollapsed />);
        await userEvent.tab();
        const button = screen.getByRole('button', { name: '首页' });
        expect(button).toHaveFocus();
        expect(button.closest('li')).not.toHaveAttribute('tabindex');
        await waitFor(() => expect(button).toHaveAccessibleDescription('首页'));
        await userEvent.tab();
        expect(screen.getByRole('button', { name: '用户' })).toHaveFocus();
    });

    // A server-rendered sidebar must be readable before hydration and without JavaScript
    it('服务端渲染时默认展开的子菜单保持展开', () => {
        const html = renderToString(
            <Nav defaultOpenKeys={['user']}>
                <Nav.Sub itemKey="user" text="用户管理">
                    <Nav.Item itemKey="list" link="/users" text="用户列表" />
                </Nav.Sub>
                <Nav.Sub itemKey="task" text="任务管理">
                    <Nav.Item itemKey="query" link="/tasks" text="任务查询" />
                </Nav.Sub>
            </Nav>
        );
        const wrappers = [...html.matchAll(/class="semi-collapsible-wrapper"[^>]*style="([^"]*)"/g)].map((m) => m[1]);
        expect(wrappers).toHaveLength(2);
        expect(wrappers[0]).toContain('--semi-collapsible-height:calc-size(auto, size)');
        expect(wrappers[1]).toContain('--semi-collapsible-height:0px');
        expect(html).toContain('用户列表');
    });
});

const getItem = (text) => screen.getByText(text).closest(`.${prefixCls}-item`);
const getItemControl = (text) => screen.getByText(text).closest<HTMLElement>('a, button');
const isSelected = (text) => getItem(text).classList.contains(`${prefixCls}-item-selected`);
const isOpen = (text) => getSubTitle(text).getAttribute('aria-expanded') === 'true';

function JsxNav(props) {
    return (
        <Nav {...props}>
            <Nav.Item itemKey="home" text="首页" />
            <Nav.Sub itemKey="user" text="用户">
                <Nav.Item itemKey="list" text="用户列表" />
                <Nav.Item itemKey="ban" text="用户封禁" />
            </Nav.Sub>
            <Nav.Sub itemKey="job" text="任务">
                <Nav.Item itemKey="query" text="任务查询" />
            </Nav.Sub>
        </Nav>
    );
}

const treeItems = [
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

describe('Navigation 行为', () => {
    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('由 items 与 children 渲染相同的菜单', async () => {
        const { unmount } = render(<Nav defaultSelectedKeys={['list']} items={treeItems} />);
        const fromItems = getList().innerHTML;
        unmount();
        render(<JsxNav defaultSelectedKeys={['list']} />);
        // the ids that tie each sub title to its list are generated per render
        const withoutIds = (html) => html.replaceAll(/_r_\w+_/g, '');
        expect(withoutIds(getList().innerHTML)).toBe(withoutIds(fromItems));
    });

    it('以数据报告 onSelect 与 onClick，onSelect 仅对新选中的项触发', async () => {
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        const onItemClick = vi.fn<NonNullable<NavItemProps['onClick']>>();
        render(
            <Nav onClick={onClick} onSelect={onSelect}>
                <Nav.Item itemKey="home" text="首页" icon={<span>i</span>} onClick={onItemClick} />
                <Nav.Item itemKey="about" text="关于" />
            </Nav>
        );
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
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        render(
            <Nav onClick={onClick} onSelect={onSelect}>
                <Nav.Item disabled itemKey="home" text="首页" />
            </Nav>
        );
        expect(getItemControl('首页')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getItemControl('首页'));
        expect(onSelect).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
        expect(isSelected('首页')).toBe(false);
    });

    it('打开默认选中项的祖先，并标记顶层子菜单为选中', () => {
        render(<JsxNav defaultSelectedKeys={['ban']} />);
        expect(isOpen('用户')).toBe(true);
        expect(isOpen('任务')).toBe(false);
        expect(getSubTitle('用户')).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(isSelected('用户封禁')).toBe(true);
    });

    it('数字 key 的子菜单标记为选中', () => {
        render(
            <Nav defaultSelectedKeys={['list']}>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Sub itemKey={1} text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
            </Nav>
        );
        expect(isSelected('用户列表')).toBe(true);
        expect(getSubTitle('用户')).toHaveClass(`${prefixCls}-sub-title-selected`);
    });

    it('只有一个 Sub 子项时，默认选中项的父级展开', () => {
        render(
            <Nav defaultSelectedKeys={['list']}>
                <Nav.Sub itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
            </Nav>
        );
        expect(isOpen('用户')).toBe(true);
    });

    it('切换子菜单，并以相同数据报告 onOpenChange 与 onClick', async () => {
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        render(<JsxNav onClick={onClick} onOpenChange={onOpenChange} />);
        await userEvent.click(getSubTitle('用户'));
        expect(isOpen('用户')).toBe(true);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        const data = onOpenChange.mock.calls[0][0];
        expect(data).toMatchObject({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        expect(data.domEvent.type).toBe('click');
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
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(
            <Nav onOpenChange={onOpenChange}>
                <Nav.Sub disabled itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
            </Nav>
        );
        expect(getSubTitle('用户')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getSubTitle('用户'));
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(isOpen('用户')).toBe(false);
    });

    it('受控的 openKeys 在属性变化前保持不变', async () => {
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const { rerender } = render(<JsxNav openKeys={[]} onOpenChange={onOpenChange} />);
        await userEvent.click(getSubTitle('用户'));
        expect(onOpenChange).toHaveBeenCalledWith(expect.objectContaining({ openKeys: ['user'], isOpen: true }));
        expect(isOpen('用户')).toBe(false);
        rerender(<JsxNav openKeys={['job']} onOpenChange={onOpenChange} />);
        expect(isOpen('用户')).toBe(false);
        expect(isOpen('任务')).toBe(true);
    });

    it('openKeys、selectedKeys 为 null 时按受控的空值处理', async () => {
        render(<JsxNav defaultSelectedKeys={['home']} openKeys={null} selectedKeys={null} />);
        expect(isSelected('首页')).toBe(false);
        await userEvent.click(getSubTitle('用户'));
        expect(isOpen('用户')).toBe(false);
        await userEvent.click(getItemControl('首页'));
        expect(isSelected('首页')).toBe(false);
    });

    it('受控的 selectedKeys 在属性变化前保持不变，新选中 key 的父级会被打开', async () => {
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const { rerender } = render(<JsxNav selectedKeys={['home']} onSelect={onSelect} />);
        await userEvent.click(getSubTitle('用户'));
        await userEvent.click(getItemControl('用户列表'));
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'list', selectedKeys: ['list'] }));
        expect(isSelected('首页')).toBe(true);
        expect(isSelected('用户列表')).toBe(false);

        rerender(<JsxNav selectedKeys={['query']} onSelect={onSelect} />);
        expect(isSelected('任务查询')).toBe(true);
        expect(isSelected('首页')).toBe(false);
        expect(getSubTitle('任务')).toHaveClass(`${prefixCls}-sub-title-selected`);
        expect(isOpen('用户')).toBe(true);
        expect(isOpen('任务')).toBe(true);
    });

    it('items 写法下受控的 selectedKeys、openKeys 变回 undefined 时清空', () => {
        const { rerender } = render(<Nav items={treeItems} openKeys={['user']} selectedKeys={['home']} />);
        expect(isSelected('首页')).toBe(true);
        expect(isOpen('用户')).toBe(true);
        rerender(<Nav items={treeItems} />);
        expect(isSelected('首页')).toBe(false);
        expect(isOpen('用户')).toBe(false);
    });

    it('受控的 selectedKeys 变化时，已打开的子菜单重置为 defaultOpenKeys', async () => {
        // items keep their reference: new children would rebuild the menu on every render
        const { rerender } = render(<Nav defaultOpenKeys={['user']} items={treeItems} selectedKeys={['home']} />);
        await userEvent.click(getSubTitle('任务'));
        expect(isOpen('任务')).toBe(true);
        rerender(<Nav defaultOpenKeys={['user']} items={treeItems} selectedKeys={['home']} />);
        expect(isOpen('任务')).toBe(true);
        rerender(<Nav defaultOpenKeys={['user']} items={treeItems} selectedKeys={['list']} />);
        expect(isOpen('任务')).toBe(false);
        expect(isOpen('用户')).toBe(true);
    });

    // New children (any parent render) recompute the menu from the props: the uncontrolled selection goes back to
    // defaultSelectedKeys, the open subs are kept because openKeys accumulate when only selected keys are given
    it('父组件重新渲染 children 时，重置非受控的选中状态', async () => {
        function Parent() {
            const [count, setCount] = useState(0);
            return (
                <>
                    <button onClick={() => setCount(count + 1)}>rerender {count}</button>
                    <JsxNav defaultSelectedKeys={['home']} />
                </>
            );
        }
        render(<Parent />);
        await userEvent.click(getSubTitle('任务'));
        await userEvent.click(getItemControl('任务查询'));
        expect(isSelected('任务查询')).toBe(true);
        expect(isOpen('任务')).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'rerender 0' }));
        expect(isSelected('任务查询')).toBe(false);
        expect(isSelected('首页')).toBe(true);
        expect(isOpen('任务')).toBe(true);
    });

    it('items 变化时重建菜单', () => {
        const { rerender } = render(<Nav defaultSelectedKeys={['query']} items={treeItems} />);
        expect(isOpen('任务')).toBe(true);
        rerender(<Nav defaultSelectedKeys={['query']} items={[treeItems[0], treeItems[2]]} />);
        expect(screen.queryByText('用户')).toBeNull();
        expect(getList().children).toHaveLength(2);
        expect(isSelected('任务查询')).toBe(true);
    });

    it('defaultIsCollapsed 时折叠，并可通过折叠按钮切换', async () => {
        const onCollapseChange = vi.fn<NonNullable<NavProps['onCollapseChange']>>();
        render(<Nav defaultIsCollapsed footer={{ collapseButton: true }} header={{ text: 'Semi 运营后台', logo: <img alt="logo" src={logo} /> }} items={treeItems} onCollapseChange={onCollapseChange} />);
        const root = document.querySelector(`.${prefixCls}`);
        expect(root).toHaveClass(`${prefixCls}-collapsed`);
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveClass(`${prefixCls}-header-collapsed`);
        expect(document.querySelector(`.${prefixCls}-header-text`)).toBeNull();
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveClass(`${prefixCls}-footer-collapsed`);
        expect(getCollapseButton()).not.toHaveTextContent('展开侧边栏');
        expect(getCollapseButton()).toHaveAccessibleName('展开侧边栏');
        expect(document.querySelector(`.${prefixCls}-sub`)).toBeNull();

        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledWith(false);
        expect(root).not.toHaveClass(`${prefixCls}-collapsed`);
        expect(getCollapseButton()).toHaveTextContent('收起侧边栏');
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi 运营后台');
    });

    it('保持受控的 isCollapsed，并使用 collapseText', async () => {
        const onCollapseChange = vi.fn<NonNullable<NavProps['onCollapseChange']>>();
        const collapseText = vi.fn<(collapsed: boolean) => string>((collapsed) => (collapsed ? 'open it' : 'close it'));
        const { rerender } = render(<Nav footer={{ collapseButton: true, collapseText }} isCollapsed={false} onCollapseChange={onCollapseChange} />);
        expect(getCollapseButton()).toHaveTextContent('close it');
        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledWith(true);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-collapsed`);
        rerender(<Nav footer={{ collapseButton: true, collapseText }} isCollapsed onCollapseChange={onCollapseChange} />);
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-collapsed`);
        expect(collapseText).toHaveBeenLastCalledWith(true);
        expect(getCollapseButton()).toHaveAccessibleName('open it');
        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenLastCalledWith(false);
    });

    it('渲染自定义折叠按钮、footer 子元素与 footer onClick', async () => {
        const onFooterClick = vi.fn<NonNullable<NavFooterProps['onClick']>>();
        render(
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Footer collapseButton={<span>custom button</span>} onClick={onFooterClick} />
            </Nav>
        );
        expect(screen.getByText('custom button')).toBeInTheDocument();
        expect(getCollapseButton()).toBeNull();
        await userEvent.click(screen.getByText('custom button'));
        expect(onFooterClick).toHaveBeenCalledTimes(1);
    });

    it('footer 有 children 时显示 children，children 为空时才显示折叠按钮', () => {
        const { rerender } = render(
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Footer collapseButton>版权所有</Nav.Footer>
            </Nav>
        );
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveTextContent('版权所有');
        expect(getCollapseButton()).toBeNull();
        rerender(
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Footer collapseButton>{false}</Nav.Footer>
            </Nav>
        );
        expect(getCollapseButton()).not.toBeNull();
    });

    it('水平模式忽略 isCollapsed', () => {
        render(<Nav header={{ text: 'Semi' }} isCollapsed items={treeItems} mode="horizontal" />);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-collapsed`);
        expect(document.querySelector(`.${prefixCls}-header-text`)).toHaveTextContent('Semi');
    });

    it('折叠且设置 link 的 header 仍有可访问名称', () => {
        render(<Nav header={{ link: '/', logo: <IconHome />, text: 'Semi' }} isCollapsed />);
        expect(screen.getByRole('link', { name: 'Semi' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefixCls}-header-text`)).toBeNull();
    });

    it('header 包裹在链接中', () => {
        render(<Nav header={{ text: 'Semi', link: '/home', linkOptions: { target: '_blank' } }} />);
        const link = document.querySelector(`.${prefixCls}-header-link`);
        expect(link).toHaveAttribute('href', '/home');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveTextContent('Semi');
    });

    it('字符串 header 与 footer 作为内容渲染', () => {
        render(<Nav footer="版权所有" header="Semi 运营后台" />);
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveTextContent('Semi 运营后台');
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveTextContent('版权所有');
    });

    // Tooltip re-checks `:hover` once the popup is inserted, and jsdom never matches it
    function hover(el) {
        const realQuery = document.querySelectorAll.bind(document);
        vi.spyOn(document, 'querySelectorAll').mockImplementation((selector) =>
            // jsdom's NodeList is not constructible, an array stands in for it
            selector === ':hover' ? ([el] as unknown as NodeListOf<Element>) : realQuery(selector)
        );
        fireEvent.mouseEnter(el);
    }

    function unhover(el) {
        vi.mocked(document.querySelectorAll).mockRestore();
        fireEvent.mouseLeave(el);
    }

    it('折叠的子菜单在悬停 subNavOpenDelay 后打开 popup，在 subNavCloseDelay 后关闭', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(<JsxNav isCollapsed subNavCloseDelay={300} subNavOpenDelay={200} onOpenChange={onOpenChange} />);
        const title = getSubTitle('用户');
        hover(title);
        void act(() => vi.advanceTimersByTime(199));
        expect(screen.queryByText('用户列表')).toBeNull();
        expect(onOpenChange).not.toHaveBeenCalled();
        void act(() => vi.advanceTimersByTime(1));
        expect(screen.getByText('用户列表')).toBeInTheDocument();
        expect(getItem('用户列表')).toHaveClass(`semi-dropdown-item`);
        void act(() => vi.advanceTimersByTime(100));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenLastCalledWith({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        expect(isOpen('用户')).toBe(true);

        unhover(title);
        void act(() => vi.advanceTimersByTime(299));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        void act(() => vi.advanceTimersByTime(1));
        expect(onOpenChange).toHaveBeenLastCalledWith({ itemKey: 'user', openKeys: [], isOpen: false });
        expect(isOpen('用户')).toBe(false);
    });

    it('subNavOpenDelay 为 0 时，悬停即报告 popup 可见', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(<JsxNav isCollapsed subNavOpenDelay={0} onOpenChange={onOpenChange} />);
        const title = getSubTitle('用户');
        hover(title);
        // no minimum delay: the popup is inserted at once, and Dropdown reports visible after its positioning fallback
        void act(() => vi.advanceTimersByTime(0));
        expect(screen.getByText('用户列表')).toBeInTheDocument();
        void act(() => vi.advanceTimersByTime(100));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenLastCalledWith({ itemKey: 'user', openKeys: ['user'], isOpen: true });
        unhover(title);
    });

    it('导航卸载时取消待执行的悬停打开', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const { unmount } = render(<JsxNav isCollapsed subNavOpenDelay={200} onOpenChange={onOpenChange} />);
        const before = vi.getTimerCount();
        hover(getSubTitle('用户'));
        expect(vi.getTimerCount()).toBe(before + 1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
        void act(() => vi.advanceTimersByTime(1000));
        expect(onOpenChange).not.toHaveBeenCalled();
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it('选中水平子菜单 popup 中的项', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        render(<JsxNav mode="horizontal" onSelect={onSelect} />);
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-horizontal`);
        expect(screen.queryByText('任务查询')).toBeNull();
        hover(getSubTitle('任务'));
        void act(() => vi.advanceTimersByTime(100));
        expect(getItem('任务查询')).toHaveClass(`semi-dropdown-item`);
        fireEvent.mouseDown(getItem('任务查询'));
        fireEvent.click(getItem('任务查询'));
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'query', selectedKeys: ['query'] }));
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it('Enter 选中 popup 项只触发一次', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        render(<JsxNav mode="horizontal" onSelect={onSelect} />);
        hover(getSubTitle('任务'));
        void act(() => vi.advanceTimersByTime(100));
        // both Dropdown's menu activation and the item's own Enter handling used to call handleClick
        fireEvent.keyDown(getItem('任务查询'), { key: 'Enter', code: 'Enter' });
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'query' }));
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it.each([
        ['horizontal', 'hover'],
        ['collapsed', 'hover'],
        ['horizontal', 'click'],
        ['collapsed', 'click'],
    ] as const)('%s 弹层内嵌套 Sub（trigger=%s）标题按 Enter 只报告一次 openChange', (kind, trigger) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(
            <Nav isCollapsed={kind === 'collapsed'} mode={kind === 'horizontal' ? 'horizontal' : 'vertical'} onOpenChange={onOpenChange}>
                <Nav.Sub itemKey="job" text="任务">
                    <Nav.Sub dropdownProps={{ trigger }} itemKey="inner" text="子任务">
                        <Nav.Item itemKey="deep" text="深层项" />
                    </Nav.Sub>
                </Nav.Sub>
            </Nav>
        );
        hover(getSubTitle('任务'));
        void act(() => vi.advanceTimersByTime(200));
        onOpenChange.mockClear();
        const title = getSubTitle('子任务');
        expect(title).toHaveAttribute('role', 'menuitem');
        act(() => title.focus());
        fireEvent.keyDown(title, { key: 'Enter', code: 'Enter' });
        void act(() => vi.advanceTimersByTime(500));
        const inner = onOpenChange.mock.calls.filter(([data]) => data.itemKey === 'inner');
        expect(inner).toHaveLength(1);
        expect(inner[0][0]).toMatchObject({ isOpen: true });
        expect(inner[0][0].openKeys).toContain('inner');
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it.each(['horizontal', 'collapsed'] as const)('%s 弹层内嵌套 Sub 已被焦点打开时，Enter 不关闭它', (kind) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(
            <Nav isCollapsed={kind === 'collapsed'} mode={kind === 'horizontal' ? 'horizontal' : 'vertical'} onOpenChange={onOpenChange}>
                <Nav.Sub itemKey="job" text="任务">
                    <Nav.Sub itemKey="inner" text="子任务">
                        <Nav.Item itemKey="deep" text="深层项" />
                    </Nav.Sub>
                </Nav.Sub>
            </Nav>
        );
        hover(getSubTitle('任务'));
        void act(() => vi.advanceTimersByTime(200));
        const title = getSubTitle('子任务');
        act(() => title.focus());
        void act(() => vi.advanceTimersByTime(500));
        expect(screen.getByText('深层项')).toBeInTheDocument();
        onOpenChange.mockClear();
        fireEvent.keyDown(title, { key: 'Enter', code: 'Enter' });
        void act(() => vi.advanceTimersByTime(500));
        expect(onOpenChange.mock.calls.filter(([data]) => data.isOpen === false)).toHaveLength(0);
        expect(screen.getByText('深层项')).toBeInTheDocument();
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it.each([
        ['horizontal', 'nested'],
        ['collapsed', 'nested'],
        ['horizontal', 'top'],
        ['collapsed', 'top'],
    ] as const)('%s 弹层的 %s Sub（trigger=click）鼠标单击只报告一次 openChange', (kind, level) => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        const click = { dropdownProps: { trigger: 'click' } } as const;
        render(
            <Nav isCollapsed={kind === 'collapsed'} mode={kind === 'horizontal' ? 'horizontal' : 'vertical'} onClick={onClick} onOpenChange={onOpenChange}>
                <Nav.Sub itemKey="job" text="任务" {...(level === 'top' ? click : {})}>
                    <Nav.Sub itemKey="inner" text="子任务" {...click}>
                        <Nav.Item itemKey="deep" text="深层项" />
                    </Nav.Sub>
                </Nav.Sub>
            </Nav>
        );
        const target = level === 'top' ? 'job' : 'inner';
        if (level === 'nested') {
            hover(getSubTitle('任务'));
            void act(() => vi.advanceTimersByTime(200));
        }
        onOpenChange.mockClear();
        fireEvent.click(getSubTitle(level === 'top' ? '任务' : '子任务'));
        void act(() => vi.advanceTimersByTime(500));
        const calls = onOpenChange.mock.calls.filter(([data]) => data.itemKey === target);
        expect(calls).toHaveLength(1);
        expect(calls[0][0]).toMatchObject({ isOpen: true });
        expect(calls[0][0].openKeys).toContain(target);
        expect(onClick.mock.calls.filter(([data]) => data.itemKey === target)).toHaveLength(1);
        if (level === 'nested') vi.mocked(document.querySelectorAll).mockRestore();
    });

    it('Item 点击、Sub 点击与 popup 项 Enter 都以原生事件报告 domEvent', async () => {
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const { unmount } = render(<JsxNav onClick={onClick} onSelect={onSelect} />);
        await userEvent.click(getItemControl('首页'));
        await userEvent.click(getSubTitle('用户'));
        unmount();

        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        render(<JsxNav mode="horizontal" onClick={onClick} onSelect={onSelect} />);
        hover(getSubTitle('任务'));
        void act(() => vi.advanceTimersByTime(100));
        fireEvent.keyDown(getItem('任务查询'), { key: 'Enter', code: 'Enter' });
        vi.mocked(document.querySelectorAll).mockRestore();

        expect(onClick.mock.calls.map(([data]) => data.itemKey)).toEqual(['home', 'user', 'query']);
        expect(onSelect.mock.calls.map(([data]) => data.itemKey)).toEqual(['home', 'query']);
        for (const [data] of [...onClick.mock.calls, ...onSelect.mock.calls]) {
            expect(data.domEvent).toBeInstanceOf(Event);
            expect(data.domEvent).not.toHaveProperty('nativeEvent');
        }
    });

    it('回调数据与 toggleIcon 的类型按运行时声明', () => {
        type ClickData = Parameters<NonNullable<NavProps['onClick']>>[0];
        expectTypeOf<NavProps['toggleIconPosition']>().toEqualTypeOf<'left' | 'right' | undefined>();
        expectTypeOf<ClickData['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
        expectTypeOf<ClickData['text']>().toEqualTypeOf<ReactNode>();
        expectTypeOf<ClickData['openKeys']>().toEqualTypeOf<ItemKey[] | undefined>();
        // onSelect never reports whether a sub is open
        expectTypeOf<OnSelectedData>().not.toHaveProperty('isOpen');
        expectTypeOf<Parameters<NonNullable<NavItemProps['onClick']>>[0]['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
        expectTypeOf<Parameters<NonNullable<NavProps['onOpenChange']>>[0]['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
        expectTypeOf<Parameters<NonNullable<NavProps['onSelect']>>[0]['domEvent']>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
        expectTypeOf<NavItemProps['toggleIcon']>().toEqualTypeOf<ReactNode>();
    });

    it('点击水平子菜单标题只报告 onClick，展开状态由弹层决定', async () => {
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        render(<JsxNav mode="horizontal" onClick={onClick} onOpenChange={onOpenChange} />);
        fireEvent.click(screen.getByText('用户'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'user', isOpen: false }));
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    // openKeysIsControlled requires vertical and expanded, so the popup keeps its hover trigger
    it('水平模式下，受控 openKeys 不驱动 popup', () => {
        render(<JsxNav mode="horizontal" openKeys={['user']} />);
        expect(screen.queryByText('用户列表')).toBeNull();
    });

    it('折叠的顶层项以 tooltip 显示文本', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        render(<JsxNav isCollapsed tooltipShowDelay={100} />);
        hover(getItemControl('首页'));
        void act(() => vi.advanceTimersByTime(99));
        expect(screen.getAllByText('首页')).toHaveLength(1);
        void act(() => vi.advanceTimersByTime(1));
        expect(screen.getAllByText('首页')).toHaveLength(2);
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it('每个项都经过 renderWrapper', () => {
        const renderWrapper = vi.fn<NonNullable<NavProps['renderWrapper']>>(({ itemElement, isSubNav, isInSubNav, props }) => (
            <div data-in={String(isInSubNav)} data-sub={String(isSubNav)} data-wrap={props.itemKey}>
                {itemElement}
            </div>
        ));
        render(<JsxNav defaultOpenKeys={['user']} renderWrapper={renderWrapper} />);
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
        const icons = (text) => (screen.getByText(text).closest(`.${prefixCls}-sub-title`) ?? getItem(text)).querySelectorAll(`.${prefixCls}-item-icon`).length;
        const { unmount } = render(<Nav defaultOpenKeys={['a', 'b']} items={items} />);
        const limited = [icons('B'), icons('C')];
        unmount();
        render(<Nav defaultOpenKeys={['a', 'b']} items={items} limitIndent={false} />);
        expect(limited).toEqual([2, 2]);
        expect([icons('B'), icons('C')]).toEqual([2, 3]);
    });

    it('通过 toggleIconPosition 把展开图标放在左侧', () => {
        render(<JsxNav toggleIconPosition="left" />);
        const inner = getSubTitle('用户').querySelector(`.${prefixCls}-item-inner`);
        expect(inner.firstElementChild).toHaveClass(`${prefixCls}-item-icon-toggle-left`);
    });

    // an inline link follows itself on Enter; in a popup the li is the menuitem, so activating it clicks the inner
    // link and the browser follows it by its own target and rel
    it('Enter 与 Space 激活 popup 链接项时各点击一次内部链接并只报告一次', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        render(
            <Nav mode="horizontal" onClick={onClick}>
                <Nav.Sub itemKey="more" text="更多">
                    <Nav.Item itemKey="docs" link="#docs" text="文档" />
                </Nav.Sub>
            </Nav>
        );
        hover(getSubTitle('更多'));
        void act(() => vi.advanceTimersByTime(100));
        expect(screen.getByText('文档').closest('a')).toHaveAttribute('tabindex', '-1');
        fireEvent.keyDown(getItem('文档'), { key: 'Enter', code: 'Enter' });
        expect(click).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(getItem('文档'), { key: ' ', code: 'Space' });
        expect(click).toHaveBeenCalledTimes(2);
        expect(onClick).toHaveBeenCalledTimes(2);
        click.mockRestore();
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it('禁用的 popup 链接项按 Enter 不触发点击与内部链接', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
        const onClick = vi.fn<NonNullable<NavProps['onClick']>>();
        render(
            <Nav mode="horizontal" onClick={onClick}>
                <Nav.Sub itemKey="more" text="更多">
                    <Nav.Item disabled itemKey="docs" link="#docs" text="文档" />
                </Nav.Sub>
            </Nav>
        );
        hover(getSubTitle('更多'));
        void act(() => vi.advanceTimersByTime(100));
        fireEvent.keyDown(getItem('文档'), { key: 'Enter', code: 'Enter' });
        expect(click).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
        click.mockRestore();
        vi.mocked(document.querySelectorAll).mockRestore();
    });

    it('data 属性透传到根节点与各项', () => {
        render(
            <Nav data-testid="nav">
                <Nav.Item data-item="home" itemKey="home" text="首页" />
            </Nav>
        );
        expect(screen.getByTestId('nav')).toHaveClass(prefixCls);
        expect(getItem('首页')).toHaveAttribute('data-item', 'home');
    });

    it('从 semiGlobal overrideDefaultProps 的 Nav 键读取默认值', () => {
        // @ts-expect-error Navigation is not a global key
        semiGlobal.config.overrideDefaultProps = { Navigation: { mode: 'horizontal' } };
        const { unmount } = render(<JsxNav />);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-horizontal`);
        unmount();
        semiGlobal.config.overrideDefaultProps = { Nav: { mode: 'horizontal', toggleIconPosition: 'left' } };
        render(<JsxNav />);
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-horizontal`);
    });

    it('StrictMode 下每次交互只报告一次', async () => {
        const onSelect = vi.fn<NonNullable<NavProps['onSelect']>>();
        const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
        const onCollapseChange = vi.fn<NonNullable<NavProps['onCollapseChange']>>();
        render(
            <StrictMode>
                <Nav defaultSelectedKeys={['home']} footer={{ collapseButton: true }} items={treeItems} onCollapseChange={onCollapseChange} onOpenChange={onOpenChange} onSelect={onSelect} />
            </StrictMode>
        );
        expect(isSelected('首页')).toBe(true);
        await userEvent.click(getSubTitle('用户'));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(isOpen('用户')).toBe(true);
        await userEvent.click(getItemControl('用户列表'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(isSelected('用户列表')).toBe(true);
        await userEvent.click(getCollapseButton());
        expect(onCollapseChange).toHaveBeenCalledTimes(1);
    });

    describe('Sub 的 dropdownProps', () => {
        const popupOf = (text) => screen.getByText(text).closest<HTMLElement>('.semi-dropdown');

        it('dropdownProps.style 作用于弹层', () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            render(
                <Nav mode="horizontal">
                    <Nav.Sub dropdownProps={{ style: { width: 200 } }} itemKey="more" text="更多">
                        <Nav.Item itemKey="docs" text="文档" />
                    </Nav.Sub>
                </Nav>
            );
            hover(getSubTitle('更多'));
            void act(() => vi.advanceTimersByTime(100));
            expect(popupOf('文档')).toHaveStyle({ width: '200px' });
            vi.mocked(document.querySelectorAll).mockRestore();
        });

        it('Nav 的 subDropdownProps.style 作用于弹层', () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            render(<Nav items={treeItems} mode="horizontal" subDropdownProps={{ style: { width: 180 } }} />);
            hover(getSubTitle('用户'));
            void act(() => vi.advanceTimersByTime(100));
            expect(popupOf('用户列表')).toHaveStyle({ width: '180px' });
            vi.mocked(document.querySelectorAll).mockRestore();
        });

        it('弹层中的 Item 与嵌套 Sub 追加 className 与 style', () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            render(
                <Nav mode="horizontal">
                    <Nav.Sub itemKey="more" text="更多">
                        <Nav.Item className="custom-item" style={{ color: 'red' }} itemKey="docs" text="文档" />
                        <Nav.Sub style={{ color: 'blue' }} itemKey="deep" text="深层">
                            <Nav.Item itemKey="leaf" text="叶子" />
                        </Nav.Sub>
                    </Nav.Sub>
                </Nav>
            );
            hover(getSubTitle('更多'));
            void act(() => vi.advanceTimersByTime(100));
            const docs = screen.getByText('文档').closest('li');
            expect(docs).toHaveClass('custom-item', `${prefixCls}-item`);
            // inline style attribute, as getComputedStyle does not resolve it for the detached popup
            expect(docs).toHaveAttribute('style', expect.stringContaining('color: red'));
            expect(screen.getByText('深层').closest('li')).toHaveAttribute('style', expect.stringContaining('color: blue'));
            vi.mocked(document.querySelectorAll).mockRestore();
        });

        it('dropdownProps.trigger 为 click 时悬停不打开弹层', () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            render(
                <Nav mode="horizontal">
                    <Nav.Sub dropdownProps={{ trigger: 'click' }} itemKey="more" text="更多">
                        <Nav.Item itemKey="docs" text="文档" />
                    </Nav.Sub>
                </Nav>
            );
            hover(getSubTitle('更多'));
            void act(() => vi.advanceTimersByTime(300));
            expect(screen.queryByText('文档')).toBeNull();
            vi.mocked(document.querySelectorAll).mockRestore();
        });

        it('用户传入 onVisibleChange 时 onOpenChange 仍触发', () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            const onVisibleChange = vi.fn<NonNullable<DropdownProps['onVisibleChange']>>();
            const onOpenChange = vi.fn<NonNullable<NavProps['onOpenChange']>>();
            render(
                <Nav mode="horizontal" onOpenChange={onOpenChange}>
                    <Nav.Sub dropdownProps={{ onVisibleChange }} itemKey="more" text="更多">
                        <Nav.Item itemKey="docs" text="文档" />
                    </Nav.Sub>
                </Nav>
            );
            hover(getSubTitle('更多'));
            void act(() => vi.advanceTimersByTime(100));
            void act(() => vi.advanceTimersByTime(100));
            expect(onVisibleChange).toHaveBeenCalledWith(true);
            expect(onOpenChange).toHaveBeenCalledWith(expect.objectContaining({ itemKey: 'more', isOpen: true }));
            vi.mocked(document.querySelectorAll).mockRestore();
        });
    });
});

describe('函数组件形式的 Navigation', () => {
    it('受控 selectedKeys 变化时，在同一次渲染中生效', () => {
        const seen = [];
        const renderWrapper = ({ itemElement, props }) => {
            if (props.itemKey === 'query') {
                seen.push(itemElement.props.className.includes(`${prefixCls}-item-selected`));
            }
            return itemElement;
        };
        const { rerender } = render(<Nav items={treeItems} openKeys={['job']} selectedKeys={['home']} renderWrapper={renderWrapper} />);
        seen.length = 0;
        rerender(<Nav items={treeItems} openKeys={['job']} selectedKeys={['query']} renderWrapper={renderWrapper} />);
        expect(seen.length).toBeGreaterThan(0);
        expect(seen.every(Boolean)).toBe(true);
    });

    it('未知属性透传到根元素', () => {
        render(
            <Nav id="nav" aria-label="主导航">
                <Nav.Header data-part="header" text="Semi" />
                <Nav.Item title="home page" itemKey="home" text="首页" />
                <Nav.Sub data-sub="user" itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
                <Nav.Footer data-part="footer" />
            </Nav>
        );
        const root = document.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('id', 'nav');
        expect(root).toHaveAttribute('aria-label', '主导航');
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveAttribute('data-part', 'header');
        expect(document.querySelector(`.${prefixCls}-footer`)).toHaveAttribute('data-part', 'footer');
        expect(getItem('首页')).toHaveAttribute('title', 'home page');
        expect(document.querySelector(`.${prefixCls}-item-sub`)).toHaveAttribute('data-sub', 'user');
    });

    it('非 DOM 属性的项配置字段不落到 DOM', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<Nav defaultOpenKeys={['user']} items={['首页', { itemKey: 'user', text: '用户', items: ['用户列表'] }]} />);
        for (const el of document.querySelectorAll(`.${prefixCls}-item`)) {
            expect(el).not.toHaveAttribute('maxheight');
            expect(el).not.toHaveAttribute('items');
            expect(el).not.toHaveAttribute('toggleicon');
        }
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('未声明的项配置字段不落到 DOM，但 data-* 与 aria-* 会透传', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        // a variable rather than a literal: undeclared config fields are the input under test
        const items = [
            {
                itemKey: 'home',
                text: '首页',
                path: '/home',
                someCamelKey: 1,
                'data-x': 'a',
                'aria-describedby': 'tip',
            },
            {
                itemKey: 'user',
                text: '用户',
                path: '/user',
                someCamelKey: 2,
                'data-sub': 'b',
                items: [{ itemKey: 'list', text: '用户列表', path: '/list', someCamelKey: 3 }],
            },
        ];
        render(<Nav defaultOpenKeys={['user']} items={items} />);
        for (const el of document.querySelectorAll(`.${prefixCls}-item`)) {
            expect(el).not.toHaveAttribute('path');
            expect(el).not.toHaveAttribute('somecamelkey');
        }
        expect(getItem('首页')).toHaveAttribute('data-x', 'a');
        expect(getItem('首页')).not.toHaveAttribute('aria-describedby');
        expect(getItemControl('首页')).toHaveAttribute('aria-describedby', 'tip');
        expect(document.querySelector(`.${prefixCls}-item-sub`)).toHaveAttribute('data-sub', 'b');
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('子菜单的 aria-* 放在标题按钮上，而不是 li 上', () => {
        // a variable rather than a literal: undeclared config fields are the input under test
        const items = [
            {
                itemKey: 'user',
                text: '用户',
                'aria-label': '用户菜单',
                'data-sub': 'b',
                items: [{ itemKey: 'list', text: '用户列表' }],
            },
        ];
        render(<Nav items={items} />);
        expect(getSubTitle('用户')).toBe(screen.getByRole('button', { name: '用户菜单' }));
        const li = document.querySelector(`.${prefixCls}-item-sub`);
        expect(li).not.toHaveAttribute('role');
        expect(li).not.toHaveAttribute('aria-label');
        expect(li).toHaveAttribute('data-sub', 'b');
    });

    it('ref 指向根元素', () => {
        const navRef = { current: null };
        const itemRef = { current: null };
        const subRef = { current: null };
        render(
            <Nav ref={navRef}>
                <Nav.Item ref={itemRef} itemKey="home" text="首页" />
                <Nav.Sub ref={subRef} itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
            </Nav>
        );
        expect(navRef.current).toBe(document.querySelector(`.${prefixCls}`));
        expect(itemRef.current).toBe(getItem('首页'));
        expect(subRef.current).toBe(document.querySelector(`.${prefixCls}-item-sub`));
    });
});

describe('Navigation 的类名前缀', () => {
    it('根、列表、Item、Sub、Header、Footer 的类名前缀一致', () => {
        render(
            <Nav defaultOpenKeys={['user']} footer={{ collapseButton: true }} header={{ link: '#', logo: <img alt="" src={logo} />, text: 'Semi' }}>
                <Nav.Item itemKey="home" link="#home" text="首页" />
                <Nav.Item itemKey="docs" text="文档" />
                <Nav.Sub itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
            </Nav>
        );
        const root = document.querySelector(`.${prefixCls}`);
        const suffixes = ['list-wrapper', 'list', 'item', 'item-link', 'item-button', 'item-text', 'item-sub', 'sub-title', 'sub', 'sub-wrap', 'header', 'header-link', 'header-logo', 'header-text', 'footer', 'collapse-btn'];
        expect(suffixes.filter((suffix) => !root.querySelector(`.${prefixCls}-${suffix}`))).toEqual([]);
        const stray = [...root.querySelectorAll('[class*="navigation"]')].flatMap((el) => [...el.classList]).filter((name) => name.includes('navigation') && !name.startsWith(prefixCls));
        expect(stray).toEqual([]);
    });
});

describe('Navigation 的 items 派生与项渲染', () => {
    it('回调显式为 null 时点击项与折叠按钮不抛错', async () => {
        render(<Nav footer={{ collapseButton: true }} items={[{ itemKey: 'a', text: 'A' }]} onClick={null} onCollapseChange={null} onOpenChange={null} onSelect={null} />);
        await userEvent.click(screen.getByText('A'));
        await userEvent.click(screen.getByRole('button', { name: '收起侧边栏' }));
        expect(screen.getByRole('button', { name: '展开侧边栏' })).toBeInTheDocument();
    });

    it('Fragment 里的 Sub 与 Item 是导航项，参与按选中项展开', () => {
        render(
            <Nav defaultSelectedKeys={['a1']}>
                <>
                    <Nav.Sub itemKey="a" text="A">
                        <Nav.Item itemKey="a1" text="A1" />
                    </Nav.Sub>
                    <Nav.Item itemKey="b" text="B" />
                </>
            </Nav>
        );
        expect(getSubTitle('A')).toHaveAttribute('aria-expanded', 'true');
        expect(document.querySelector(`.${prefixCls}-list-extra`)).toBeNull();
        expect(getList().children).toHaveLength(2);
    });

    it('itemKey 为 0 的项与 itemKey 为 "00" 的项不产生重复的 React key', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <Nav
                items={[
                    { itemKey: 0, text: 'a' },
                    { itemKey: '00', text: 'b' },
                ]}
            />
        );
        const messages = error.mock.calls.map((args) => String(args[0]));
        error.mockRestore();
        expect(messages.filter((message) => message.includes('same key'))).toEqual([]);
        expect(screen.getByText('a')).toBeInTheDocument();
        expect(screen.getByText('b')).toBeInTheDocument();
    });

    it('items 变化后的第一次提交就渲染新的项', () => {
        const committed: string[] = [];
        const onRender = () => committed.push(getList().textContent);
        const { rerender } = render(
            <Profiler id="nav" onRender={onRender}>
                <Nav items={[{ itemKey: 'a', text: '旧项' }]} />
            </Profiler>
        );
        committed.length = 0;
        rerender(
            <Profiler id="nav" onRender={onRender}>
                <Nav items={[{ itemKey: 'b', text: '新项' }]} />
            </Profiler>
        );
        expect(committed[0]).toBe('新项');
    });

    it('父组件重新渲染 children 时，Nav 只提交一次', async () => {
        const commits: number[] = [];
        function Parent() {
            const [count, setCount] = useState(0);
            return (
                <>
                    <button onClick={() => setCount(count + 1)}>rerender {count}</button>
                    <Profiler id="nav" onRender={() => commits.push(1)}>
                        <JsxNav defaultSelectedKeys={['home']} />
                    </Profiler>
                </>
            );
        }
        render(<Parent />);
        commits.length = 0;
        await userEvent.click(screen.getByRole('button', { name: 'rerender 0' }));
        expect(commits).toHaveLength(1);
    });

    it('Sub 的 Semi 图标保留自定义 size，非 Semi 元素不带 size 属性', () => {
        render(
            <Nav>
                <Nav.Sub itemKey="a" text="A" icon={<IconHome data-testid="semi-icon" size="small" />}>
                    <Nav.Item itemKey="a1" text="A1" />
                </Nav.Sub>
                <Nav.Sub itemKey="b" text="B" icon={<span data-testid="plain-icon" />}>
                    <Nav.Item itemKey="b1" text="B1" />
                </Nav.Sub>
            </Nav>
        );
        expect(screen.getByTestId('semi-icon')).toHaveClass('semi-icon-small');
        expect(screen.getByTestId('plain-icon')).not.toHaveAttribute('size');
    });

    it('renderWrapper 收到的 Sub 属性是 SubNav 自身的属性', () => {
        const expandIcon = <span data-testid="expand" />;
        const icon = <span data-testid="icon" />;
        const received: unknown[] = [];
        render(
            <Nav
                renderWrapper={({ itemElement, isSubNav, props }) => {
                    if (isSubNav) {
                        received.push(props);
                    }
                    return itemElement;
                }}
            >
                <Nav.Sub expandIcon={expandIcon} itemKey="a" text="A" icon={icon}>
                    <Nav.Item itemKey="a1" text="A1" />
                </Nav.Sub>
            </Nav>
        );
        expect(received).toEqual([expect.objectContaining({ itemKey: 'a', icon, expandIcon })]);
    });
});

describe('Navigation 的 Tab 停留点', () => {
    it('折叠时，折叠按钮是唯一的 Tab 停留点，并由 tooltip 描述', async () => {
        render(<Nav defaultIsCollapsed footer={{ collapseButton: true }} />);
        await userEvent.tab();
        const button = document.activeElement;
        expect(button.tagName).toBe('BUTTON');
        await waitFor(() => expect(button).toHaveAccessibleDescription('展开侧边栏'));
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('Navigation 的收起与展开保持焦点', () => {
    it('折叠按钮按 Enter 展开与收起后仍是同一个按钮并持有焦点', async () => {
        render(<Nav footer={{ collapseButton: true }} items={treeItems} />);
        const button = getCollapseButton();
        act(() => button.focus());
        await userEvent.keyboard('{Enter}');
        expect(getCollapseButton()).toBe(button);
        expect(button).toHaveFocus();
        expect(button).toHaveAccessibleName('展开侧边栏');
        await userEvent.keyboard('{Enter}');
        expect(getCollapseButton()).toBe(button);
        expect(button).toHaveFocus();
    });

    it('受控的 isCollapsed 外部切换时，顶层项保持焦点', () => {
        const { rerender } = render(<JsxNav isCollapsed={false} />);
        const control = getItemControl('首页');
        act(() => control.focus());
        rerender(<JsxNav isCollapsed />);
        expect(control.isConnected).toBe(true);
        expect(control).toHaveFocus();
    });

    it('受控的 isCollapsed 外部切换时，Sub 标题保持焦点', () => {
        const { rerender } = render(<JsxNav isCollapsed={false} />);
        act(() => getSubTitle('用户').focus());
        rerender(<JsxNav isCollapsed />);
        expect(document.activeElement.closest(`.${prefixCls}-sub-title`)).toHaveTextContent('用户');
        rerender(<JsxNav isCollapsed={false} />);
        expect(document.activeElement.closest(`.${prefixCls}-sub-title`)).toHaveTextContent('用户');
    });
});

describe('Navigation 的透传与合并', () => {
    it('Sub 的 dropdownProps.className 追加到内置弹层类名之后', async () => {
        render(
            <Nav isCollapsed>
                <Nav.Sub dropdownProps={{ className: 'x', trigger: 'click' }} itemKey="a" text="A">
                    <Nav.Item itemKey="a1" text="A1" />
                </Nav.Sub>
            </Nav>
        );
        await userEvent.click(document.querySelector(`.${prefixCls}-sub-title`));
        await waitFor(() => expect(document.querySelector('.x')).toHaveClass(`${prefixCls}-popover`));
    });

    it('items 配置里 Sub 自带的 expandIcon、subDropdownProps 优先于 Nav 的', () => {
        render(<Nav expandIcon={<span data-testid="nav-icon" />} items={[{ itemKey: 'a', text: 'A', expandIcon: <span data-testid="own-icon" />, items: ['A1'] }]} />);
        expect(screen.getByTestId('own-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('nav-icon')).toBeNull();
    });

    it('Sub 的 expandIcon 保留自带的 className', () => {
        render(
            <Nav>
                <Nav.Sub expandIcon={<span className="mine" data-testid="expand" />} itemKey="a" text="A">
                    <Nav.Item itemKey="a1" text="A1" />
                </Nav.Sub>
            </Nav>
        );
        expect(screen.getByTestId('expand')).toHaveClass('mine', `${prefixCls}-icon-rotate-0`);
    });

    it('items 配置里 Sub 未写 expandIcon 时使用 Nav 的', () => {
        render(<Nav expandIcon={<span data-testid="nav-icon" />} items={[{ itemKey: 'a', text: 'A', items: ['A1'] }]} />);
        expect(screen.getByTestId('nav-icon')).toBeInTheDocument();
    });

    it('linkOptions.className 追加到 Item 与 Header 的内置链接类名', () => {
        render(<Nav header={{ link: '/', text: 'Semi', linkOptions: { className: 'mine-header' } }} items={[{ itemKey: 'a', text: 'A', link: '/a', linkOptions: { className: 'mine-item' } }]} />);
        expect(screen.getByRole('link', { name: 'Semi' })).toHaveClass('mine-header', `${prefixCls}-header-link`);
        expect(screen.getByRole('link', { name: 'A' })).toHaveClass('mine-item', `${prefixCls}-item-link`);
    });

    it('内联 Sub 收起时，标题不指向已卸载的列表', async () => {
        render(<JsxNav />);
        const title = getSubTitle('用户');
        expect(title).not.toHaveAttribute('aria-controls');
        await userEvent.click(title);
        const listId = title.getAttribute('aria-controls');
        expect(listId).toBeTruthy();
        expect(document.getElementById(listId)).not.toBeNull();
    });
});
