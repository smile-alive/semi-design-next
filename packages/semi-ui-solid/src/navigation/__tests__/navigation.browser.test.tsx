import { For, createEffect, createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Nav, { type ItemKey, type NavItems } from '..';
import Button from '../../button';

const prefix = `${BASE_CLASS_PREFIX}-navigation`;

function ItemsChange() {
    const [items, setItems] = createSignal<NavItems>([
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '公会中心' },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ]);
    const change = () =>
        setItems(
            items().length === 3
                ? [
                      { itemKey: 'union', text: '公会中心' },
                      { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
                  ]
                : []
        );
    return (
        <>
            <Button onClick={change}>change items</Button>
            <Nav bodyStyle={{ height: '150px' }} items={items()} />
        </>
    );
}

const routerConfig: Record<string, { itemKey: string; text: string; items: NavItems }> = {
    config: {
        itemKey: '/config',
        text: 'Config',
        items: [
            {
                itemKey: '/config/ability',
                text: 'Ability',
                items: [{ itemKey: '/config/ability/management', text: 'Ability management' }],
            },
            {
                itemKey: '/config/task',
                text: 'Task',
                items: [{ itemKey: '/config/task/management', text: 'Word management' }],
            },
        ],
    },
    distribution: {
        itemKey: '/distribution',
        text: 'Distribution',
        items: [
            {
                itemKey: '/distribution/queue',
                text: 'Queue',
                items: [{ itemKey: '/distribution/queue/management', text: 'Config management' }],
            },
        ],
    },
};
const redirects: Record<string, string> = { '/config': '/config/ability/management', '/distribution': '/distribution/queue/management' };

// A router in miniature: the header navigates to a section, which then redirects to its first page, so the sider
// Nav gets new items and new selectedKeys in two consecutive updates
function FixedSelectedKeys() {
    const [path, setPath] = createSignal('/');
    createEffect(() => {
        const target = redirects[path()];
        if (target) {
            setPath(target);
        }
    });
    const section = () => path().split('/')[1];
    return (
        <>
            <Nav mode="horizontal" selectedKeys={[`/${section()}`]}>
                <For each={Object.values(routerConfig)}>{(option) => <Nav.Item itemKey={option.itemKey} text={option.text} onClick={() => setPath(option.itemKey)} />}</For>
            </Nav>
            <Nav items={routerConfig[section()]?.items ?? []} selectedKeys={[path()]} />
        </>
    );
}

function FixedOpenKeys() {
    const [selectedKeys, setSelectedKeys] = createSignal<ItemKey[]>(['入驻审核']);
    return (
        <Nav
            items={[
                { itemKey: 'user', text: '用户管理' },
                { itemKey: 'union', text: '公会中心' },
                { itemKey: 'union-management', text: '公会管理', items: ['公告设置', '公会查询', '信息录入'] },
                {
                    itemKey: 'approve-management',
                    text: '审批管理',
                    items: ['入驻审核', { itemKey: 'operation-management', text: '运营管理', items: ['人员管理', '人员变更'] }],
                },
                { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
            ]}
            selectedKeys={selectedKeys()}
            onSelect={({ selectedKeys }) => setSelectedKeys(selectedKeys)}
        />
    );
}

const itemText = (text: string) => [...document.querySelectorAll(`.${prefix}-item-text`)].find((el) => el.textContent === text) as Element;
const selectedTexts = () => [...document.querySelectorAll(`.${prefix}-item-selected`)].map((el) => el.textContent);

describe('Navigation（浏览器）', () => {
    it('动态变化', async () => {
        render(() => <ItemsChange />);
        expect(screen.getByText('用户管理')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'change items' }));
        await waitFor(() => expect(screen.queryByText('用户管理')).toBeNull());
    });

    it('自动展开', async () => {
        render(() => (
            <Nav
                bodyStyle={{ height: '480px' }}
                defaultSelectedKeys={['人员管理']}
                items={[
                    { itemKey: 'user', text: '用户管理' },
                    { itemKey: 'union', text: '公会中心' },
                    { itemKey: 'union-management', text: '公会管理', items: ['公告设置', '公会查询', '信息录入'] },
                    {
                        itemKey: 'approve-management',
                        text: '审批管理',
                        items: ['入驻审核', { itemKey: 'operation-management', text: '运营管理', items: ['人员管理', '人员变更'] }],
                    },
                    { text: '任务平台', itemKey: 'job', items: ['任务管理', '用户任务查询'] },
                ]}
            />
        ));
        await waitFor(() => expect(screen.getByText('人员管理')).toBeVisible());
    });

    it('selectedKeys 变化', async () => {
        render(() => <FixedSelectedKeys />);
        await userEvent.click(itemText('Config'));
        await waitFor(() => expect(selectedTexts()).toContain('Ability management'));
        expect(document.querySelector(`.${prefix}-sub-title.${prefix}-sub-title-selected`)).toHaveTextContent('Ability');

        await userEvent.click(itemText('Distribution'));
        await waitFor(() => expect(selectedTexts()).toContain('Config management'));
        expect(document.querySelector(`.${prefix}-sub-title.${prefix}-sub-title-selected`)).not.toBeNull();
    });

    it('在菜单项、链接和子标题上显示主题焦点环', async () => {
        render(() => (
            <Nav defaultOpenKeys={['user']} mode="vertical">
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Sub itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
                <Nav.Item itemKey="docs" link="#docs" text="文档" />
            </Nav>
        ));
        for (const el of [screen.getByRole('button', { name: '首页' }), screen.getByRole('button', { name: '用户' }), screen.getByRole('button', { name: '用户列表' }), screen.getByRole('link', { name: '文档' })]) {
            await tabTo(el);
            expectThemeFocusRing(el);
        }
    });

    it('悬停项内的按钮时，其 li 应用悬停样式', async () => {
        render(() => (
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
            </Nav>
        ));
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
        render(() => (
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Item disabled itemKey="about" text="关于" />
            </Nav>
        ));
        const button = screen.getByRole('button', { name: '首页' });
        const li = button.closest('li') as HTMLElement;
        // the button fills the li and carries the item padding, so the text sits where the li used to put it
        expect(button.getBoundingClientRect().toJSON()).toEqual(li.getBoundingClientRect().toJSON());
        const text = screen.getByText('首页').getBoundingClientRect();
        expect(text.left - li.getBoundingClientRect().left).toBe(12);
        expect(text.top - li.getBoundingClientRect().top).toBe(8);
        const disabled = screen.getByRole('button', { name: '关于' });
        expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
        expect(getComputedStyle(disabled).color).toBe(getComputedStyle(disabled.closest('li') as HTMLElement).color);
    });

    it('窄导航中头部文字与项文字一同缩小，与收起动画期间一致', () => {
        render(() => (
            <Nav style={{ width: '100px' }} header={{ logo: () => <span style={{ width: '36px' }} />, text: 'Semi 运营后台' }}>
                <Nav.Item itemKey="user" text="用户管理" icon={<span />} />
            </Nav>
        ));
        const within = (text: string, box: Element) => expect(screen.getByText(text).getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right);
        within('用户管理', screen.getByRole('button', { name: '用户管理' }));
        within('Semi 运营后台', document.querySelector(`.${prefix}-header`) as Element);
    });

    it('展开时文字一起淡入，首次渲染时不执行', async () => {
        const { container } = render(() => (
            <Nav
                footer={{ collapseButton: true }}
                header={{ logo: () => <span style={{ width: '36px' }} />, text: 'Semi 运营后台' }}
                items={[
                    { itemKey: 'user', text: '用户管理' },
                    { itemKey: 'job', text: '任务平台', items: ['任务管理'] },
                ]}
                renderItemIcon={({ level }) => (level === 0 ? <span /> : undefined)}
            />
        ));
        const nav = container.querySelector(`.${prefix}`) as HTMLElement;
        const fading = () => document.getAnimations().filter((animation) => (animation as CSSTransition).transitionProperty === 'opacity');
        expect(fading()).toEqual([]);
        const toggleButton = () => container.querySelector<HTMLButtonElement>(`.${prefix}-collapse-btn button`) as HTMLButtonElement;
        await userEvent.click(toggleButton());
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
        // A DOM click keeps the expand and the checks below in one task: the 200ms fades cannot finish before they
        // are paused, while the round trip of a real pointer click can outlast them on a loaded machine
        toggleButton().click();
        // the texts mount again on expanding, so they all start from transparent instead of showing at once
        for (const animation of document.getAnimations()) {
            animation.pause();
            animation.currentTime = 0;
        }
        for (const text of ['Semi 运营后台', '用户管理', '任务平台', '收起侧边栏']) {
            expect(getComputedStyle(screen.getByText(text)).opacity).toBe('0');
        }
        for (const animation of document.getAnimations()) {
            animation.finish();
        }
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
        await userEvent.click(screen.getByText('任务平台'));
        await screen.findByText('任务管理');
        expect(fading().filter((animation) => (animation.effect as KeyframeEffect).target?.matches(`.${prefix}-item-text`))).toEqual([]);
    });

    // collapse-animating only helps while the width really animates; without a width transition no transitionend comes
    it.each([
        ['宽度过渡被关闭', { transition: 'none' }],
        ['宽度由内联样式固定', { width: '200px' }],
    ])('%s时，切换折叠后 collapse-animating 随即移除', async (_, style) => {
        const navItems = [{ itemKey: 'user', text: '用户管理' }];
        const [collapsed, setCollapsed] = createSignal(false);
        const { container } = render(() => <Nav style={style} isCollapsed={collapsed()} items={navItems} renderItemIcon={() => <span />} />);
        const nav = container.querySelector(`.${prefix}`) as HTMLElement;
        setCollapsed(true);
        expect(nav).toHaveClass(`${prefix}-collapsed`);
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
    });

    it('selectedKeys 变化，同时使用受控 openKeys 状态', async () => {
        const { container } = render(() => <FixedOpenKeys />);
        await userEvent.click(itemText('任务平台'));
        await userEvent.click(await screen.findByText('任务管理'));
        const subs = container.querySelectorAll(`.${prefix}-list > li.${prefix}-item-sub > .${prefix}-sub-title`);
        await waitFor(() => expect(subs[1]).toHaveAttribute('aria-expanded', 'true'));
        expect(subs[2]).toHaveAttribute('aria-expanded', 'true');
    });
});
