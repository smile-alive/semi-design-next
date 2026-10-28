import { useEffect, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Nav } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { ItemKey } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-navigation`;

function ItemsChange() {
    const [items, setItems] = useState([
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '公会中心' },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ]);
    const change = () =>
        setItems(
            items.length === 3
                ? [
                      { itemKey: 'union', text: '公会中心' },
                      { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
                  ]
                : []
        );
    return (
        <>
            <Button onClick={change}>change items</Button>
            <Nav bodyStyle={{ height: 150 }} items={items} />
        </>
    );
}

const routerConfig = {
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
const redirects = { '/config': '/config/ability/management', '/distribution': '/distribution/queue/management' };

// A router in miniature: the header navigates to a section, which then redirects to its first page, so the sider
// Nav gets new items and new selectedKeys in two consecutive renders
function FixedSelectedKeys() {
    const [path, setPath] = useState('/');
    useEffect(() => {
        if (redirects[path]) {
            setPath(redirects[path]);
        }
    }, [path]);
    const section = path.split('/')[1];
    return (
        <>
            <Nav mode="horizontal" selectedKeys={[`/${section}`]}>
                {Object.values(routerConfig).map((option) => (
                    <Nav.Item key={option.itemKey} itemKey={option.itemKey} text={option.text} onClick={() => setPath(option.itemKey)} />
                ))}
            </Nav>
            <Nav items={routerConfig[section]?.items ?? []} selectedKeys={[path]} />
        </>
    );
}

function FixedOpenKeys() {
    const [selectedKeys, setSelectedKeys] = useState<ItemKey[]>(['入驻审核']);
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
            selectedKeys={selectedKeys}
            onSelect={({ selectedKeys }) => setSelectedKeys(selectedKeys)}
        />
    );
}

const itemText = (text) => [...document.querySelectorAll(`.${prefix}-item-text`)].find((el) => el.textContent === text);
const selectedTexts = () => [...document.querySelectorAll(`.${prefix}-item-selected`)].map((el) => el.textContent);

describe('Navigation（浏览器）', () => {
    it('动态变化', async () => {
        render(<ItemsChange />);
        expect(screen.getByText('用户管理')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'change items' }));
        await waitFor(() => expect(screen.queryByText('用户管理')).toBeNull());
    });

    it('自动展开', async () => {
        render(
            <Nav
                bodyStyle={{ height: 480 }}
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
        );
        await waitFor(() => expect(screen.getByText('人员管理')).toBeVisible());
    });

    it('selectedKeys 变化', async () => {
        render(<FixedSelectedKeys />);
        await userEvent.click(itemText('Config'));
        await waitFor(() => expect(selectedTexts()).toContain('Ability management'));
        expect(document.querySelector(`.${prefix}-sub-title.${prefix}-sub-title-selected`)).toHaveTextContent('Ability');

        await userEvent.click(itemText('Distribution'));
        await waitFor(() => expect(selectedTexts()).toContain('Config management'));
        expect(document.querySelector(`.${prefix}-sub-title.${prefix}-sub-title-selected`)).not.toBeNull();
    });

    it('在菜单项、链接和子标题上显示主题焦点环', async () => {
        render(
            <Nav defaultOpenKeys={['user']} mode="vertical">
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Sub itemKey="user" text="用户">
                    <Nav.Item itemKey="list" text="用户列表" />
                </Nav.Sub>
                <Nav.Item itemKey="docs" link="#docs" text="文档" />
            </Nav>
        );
        for (const el of [screen.getByRole('button', { name: '首页' }), screen.getByRole('button', { name: '用户' }), screen.getByRole('button', { name: '用户列表' }), screen.getByRole('link', { name: '文档' })]) {
            await tabTo(el);
            expectThemeFocusRing(el);
        }
    });

    it('悬停项内的按钮时，其 li 应用悬停样式', async () => {
        render(
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
            </Nav>
        );
        const button = screen.getByRole('button', { name: '首页' });
        const li = button.closest('li');
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
        render(
            <Nav>
                <Nav.Item itemKey="home" text="首页" />
                <Nav.Item disabled itemKey="about" text="关于" />
            </Nav>
        );
        const button = screen.getByRole('button', { name: '首页' });
        const li = button.closest('li');
        // the button fills the li and carries the item padding, so the text sits where the li used to put it
        expect(button.getBoundingClientRect().toJSON()).toEqual(li.getBoundingClientRect().toJSON());
        const text = screen.getByText('首页').getBoundingClientRect();
        expect(text.left - li.getBoundingClientRect().left).toBe(12);
        expect(text.top - li.getBoundingClientRect().top).toBe(8);
        const disabled = screen.getByRole('button', { name: '关于' });
        expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
        expect(getComputedStyle(disabled).color).toBe(getComputedStyle(disabled.closest('li')).color);
    });

    it('窄导航中头部文字与项文字一同缩小，与收起动画期间一致', () => {
        render(
            <Nav style={{ width: 100 }} header={{ logo: <span style={{ width: 36 }} />, text: 'Semi 运营后台' }}>
                <Nav.Item itemKey="user" text="用户管理" icon={<span />} />
            </Nav>
        );
        const within = (text, box) => expect(screen.getByText(text).getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right);
        within('用户管理', screen.getByRole('button', { name: '用户管理' }));
        within('Semi 运营后台', document.querySelector(`.${prefix}-header`));
    });

    it('展开时文字一起淡入，首次渲染时不执行', async () => {
        const { container } = render(
            <Nav
                footer={{ collapseButton: true }}
                header={{ logo: <span style={{ width: 36 }} />, text: 'Semi 运营后台' }}
                items={[
                    { itemKey: 'user', text: '用户管理', icon: <span /> },
                    { itemKey: 'job', text: '任务平台', icon: <span />, items: ['任务管理'] },
                ]}
            />
        );
        const nav = container.querySelector(`.${prefix}`);
        const fading = () => document.getAnimations().filter((animation) => (animation as CSSTransition).transitionProperty === 'opacity');
        expect(fading()).toEqual([]);
        const toggleButton = () => container.querySelector<HTMLButtonElement>(`.${prefix}-collapse-btn button`);
        await userEvent.click(toggleButton());
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
        // A DOM click inside act keeps the expand and the checks below in one task: the 200ms fades cannot finish
        // before they are paused, while the round trip of a real pointer click can outlast them on a loaded machine
        act(() => toggleButton().click());
        // a keyframe fade, which plays on insertion without @starting-style (Firefox 125, Safari 17.2)
        expect(
            screen
                .getByText('Semi 运营后台')
                .getAnimations()
                .map((animation) => (animation as CSSAnimation).animationName)
        ).toEqual([`${prefix}-text-fade-in`]);
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
        expect(fading().filter((animation) => (animation.effect as KeyframeEffect).target.matches(`.${prefix}-item-text`))).toEqual([]);
    });

    // collapse-animating only helps while the width really animates; without a width transition no transitionend comes
    it.each([
        ['宽度过渡被关闭', { transition: 'none' }],
        ['宽度由内联样式固定', { width: 200 }],
    ])('%s时，切换折叠后 collapse-animating 随即移除', async (_, style) => {
        const navItems = [{ itemKey: 'user', text: '用户管理', icon: <span /> }];
        const { container, rerender } = render(<Nav style={style} items={navItems} />);
        const nav = container.querySelector(`.${prefix}`);
        rerender(<Nav style={style} isCollapsed items={navItems} />);
        expect(nav).toHaveClass(`${prefix}-collapsed`);
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
    });

    it('selectedKeys 变化，同时使用受控 openKeys 状态', async () => {
        const { container } = render(<FixedOpenKeys />);
        await userEvent.click(itemText('任务平台'));
        await userEvent.click(await screen.findByText('任务管理'));
        const subs = container.querySelectorAll(`.${prefix}-list > li.${prefix}-item-sub > .${prefix}-sub-title`);
        await waitFor(() => expect(subs[1]).toHaveAttribute('aria-expanded', 'true'));
        expect(subs[2]).toHaveAttribute('aria-expanded', 'true');
    });
});
