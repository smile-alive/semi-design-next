/** @jsxImportSource vue */
import { nextTick, ref, shallowRef } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Nav, { NavHeader, NavItem, SubNav, type ItemKey, type NavItems, type OnSelectedData } from '..';
import Button from '../../button';
import MiniRouter from './fixtures/mini-router.vue';

const prefix = 'semi-navigation';

const itemText = (text: string) => [...document.querySelectorAll<HTMLElement>(`.${prefix}-item-text`)].find((el) => el.textContent === text) as HTMLElement;
const selectedTexts = () => [...document.querySelectorAll(`.${prefix}-item-selected`)].map((el) => el.textContent);
const header = () => (
    <NavHeader text="Semi 运营后台">
        {{
            logo: () => <span style={{ width: '36px' }} />,
        }}
    </NavHeader>
);

describe('Navigation（浏览器）', () => {
    it('动态变化', async () => {
        // shallowRef: ref() would unwrap the item type deeply, down to the DragControls class that motion-v adds to
        // every HTML attributes type in this program, and fail to type-check
        const items = shallowRef<NavItems>([
            { itemKey: 'user', text: '用户管理' },
            { itemKey: 'union', text: '公会中心' },
            { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
        ]);
        const change = () => {
            items.value = items.value.length === 3 ? items.value.slice(1) : [];
        };
        render({
            render: () => (
                <>
                    <Button onClick={change}>{() => 'change items'}</Button>
                    <Nav bodyStyle={{ height: '150px' }} items={items.value} />
                </>
            ),
        });
        expect(screen.getByText('用户管理')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'change items' }));
        await waitFor(() => expect(screen.queryByText('用户管理')).toBeNull());
    });

    it('自动展开', async () => {
        render(Nav, {
            props: {
                bodyStyle: { height: '480px' },
                defaultSelectedKeys: ['人员管理'],
                items: [
                    { itemKey: 'user', text: '用户管理' },
                    { itemKey: 'union', text: '公会中心' },
                    { itemKey: 'union-management', text: '公会管理', items: ['公告设置', '公会查询', '信息录入'] },
                    {
                        itemKey: 'approve-management',
                        text: '审批管理',
                        items: ['入驻审核', { itemKey: 'operation-management', text: '运营管理', items: ['人员管理', '人员变更'] }],
                    },
                    { text: '任务平台', itemKey: 'job', items: ['任务管理', '用户任务查询'] },
                ],
            },
        });
        await waitFor(() => expect(screen.getByText('人员管理')).toBeVisible());
    });

    it('selectedKeys 变化', async () => {
        render(MiniRouter);
        await userEvent.click(itemText('Config'));
        await waitFor(() => expect(selectedTexts()).toContain('Ability management'));
        expect(document.querySelector(`.${prefix}-sub-title.${prefix}-sub-title-selected`)).toHaveTextContent('Ability');

        await userEvent.click(itemText('Distribution'));
        await waitFor(() => expect(selectedTexts()).toContain('Config management'));
        expect(document.querySelector(`.${prefix}-sub-title.${prefix}-sub-title-selected`)).not.toBeNull();
    });

    it('在菜单项、链接和子标题上显示主题焦点环', async () => {
        render(Nav, {
            props: { defaultOpenKeys: ['user'], mode: 'vertical' },
            slots: {
                default: () => (
                    <>
                        <NavItem itemKey="home" text="首页" />
                        <SubNav itemKey="user" text="用户">
                            {() => <NavItem itemKey="list" text="用户列表" />}
                        </SubNav>
                        <NavItem itemKey="docs" link="#docs" text="文档" />
                    </>
                ),
            },
        });
        for (const el of [screen.getByRole('button', { name: '首页' }), screen.getByRole('button', { name: '用户' }), screen.getByRole('button', { name: '用户列表' }), screen.getByRole('link', { name: '文档' })]) {
            await tabTo(el);
            expectThemeFocusRing(el);
        }
    });

    it('悬停项内的按钮时，其 li 应用悬停样式', async () => {
        render(Nav, { slots: { default: () => <NavItem itemKey="home" text="首页" /> } });
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
        render(Nav, {
            slots: {
                default: () => (
                    <>
                        <NavItem itemKey="home" text="首页" />
                        <NavItem disabled itemKey="about" text="关于" />
                    </>
                ),
            },
        });
        const button = screen.getByRole('button', { name: '首页' });
        const li = button.closest('li') as HTMLElement;
        expect(button.getBoundingClientRect().toJSON()).toEqual(li.getBoundingClientRect().toJSON());
        const text = screen.getByText('首页').getBoundingClientRect();
        expect(text.left - li.getBoundingClientRect().left).toBe(12);
        expect(text.top - li.getBoundingClientRect().top).toBe(8);
        const disabled = screen.getByRole('button', { name: '关于' });
        expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
        expect(getComputedStyle(disabled).color).toBe(getComputedStyle(disabled.closest('li') as HTMLElement).color);
    });

    it('窄导航中头部文字与项文字一同缩小，与收起动画期间一致', () => {
        render(Nav, {
            props: { style: { width: '100px' } },
            slots: {
                default: () => [
                    header(),
                    <NavItem itemKey="user" text="用户管理">
                        {{
                            icon: () => <span />,
                        }}
                    </NavItem>,
                ],
            },
        });
        const within = (text: string, box: Element) => expect(screen.getByText(text).getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right);
        within('用户管理', screen.getByRole('button', { name: '用户管理' }));
        within('Semi 运营后台', document.querySelector(`.${prefix}-header`) as HTMLElement);
    });

    it('展开时文字一起淡入，首次渲染时不执行', async () => {
        const { container } = render(Nav, {
            props: {
                footer: { collapseButton: true },
                items: [
                    { itemKey: 'user', text: '用户管理' },
                    { itemKey: 'job', text: '任务平台', items: ['任务管理'] },
                ],
            },
            slots: {
                default: header,
                icon: ({ level }: { level: number }) => (level === 0 ? <span /> : []),
            },
        });
        const nav = container.querySelector(`.${prefix}`) as HTMLElement;
        const fading = () => document.getAnimations().filter((animation) => (animation as CSSTransition).transitionProperty === 'opacity');
        expect(fading()).toEqual([]);
        const toggleButton = () => container.querySelector<HTMLButtonElement>(`.${prefix}-collapse-btn button`) as HTMLButtonElement;
        await userEvent.click(toggleButton());
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
        // A DOM click and one tick keep the expand and the checks below in one task: the 200ms fades cannot finish
        // before they are paused, while the round trip of a real pointer click can outlast them on a loaded machine
        toggleButton().click();
        await nextTick();
        for (const animation of document.getAnimations()) {
            animation.pause();
            animation.currentTime = 0;
        }
        for (const text of ['Semi 运营后台', '用户管理', '任务平台']) {
            expect(getComputedStyle(screen.getByText(text)).opacity).toBe('0');
        }
        for (const animation of document.getAnimations()) {
            animation.finish();
        }
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
        await userEvent.click(screen.getByText('任务平台'));
        await screen.findByText('任务管理');
        expect(fading().filter((animation) => ((animation.effect as KeyframeEffect).target as Element).matches(`.${prefix}-item-text`))).toEqual([]);
    });

    // collapse-animating only helps while the width really animates; without a width transition no transitionend comes
    it.each([
        ['宽度过渡被关闭', { transition: 'none' }],
        ['宽度由内联样式固定', { width: '200px' }],
    ])('%s时，切换折叠后 collapse-animating 随即移除', async (_, style) => {
        const items = [{ itemKey: 'user', text: '用户管理' }];
        const view = render(Nav, { props: { style, items }, slots: { icon: () => <span /> } });
        const nav = view.container.querySelector(`.${prefix}`) as HTMLElement;
        await view.rerender({ style, items, isCollapsed: true });
        expect(nav).toHaveClass(`${prefix}-collapsed`);
        await waitFor(() => expect(nav).not.toHaveClass(`${prefix}-collapse-animating`));
    });

    it('水平导航嵌套 Sub 中的链接项，外层与内层弹层均 click 触发时仍收到 click', async () => {
        const click = vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault());
        const dropdownProps = { trigger: 'click' as const };
        render(Nav, {
            props: { mode: 'horizontal' },
            slots: {
                default: () => (
                    <SubNav itemKey="outer" text="外层" dropdownProps={dropdownProps}>
                        {() => (
                            <SubNav itemKey="inner" text="内层" dropdownProps={dropdownProps}>
                                {() => <NavItem itemKey="doc" link="#doc" text="文档" />}
                            </SubNav>
                        )}
                    </SubNav>
                ),
            },
        });
        await userEvent.click(screen.getByText('外层'));
        await userEvent.click(await screen.findByText('内层'));
        const link = (await screen.findByText('文档')).closest('a') as HTMLAnchorElement;
        link.addEventListener('click', click);
        await userEvent.click(link);
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('selectedKeys 变化，同时使用受控 openKeys 状态', async () => {
        const selectedKeys = ref<ItemKey[]>(['入驻审核']);
        const { container } = render({
            render: () => (
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
                    selectedKeys={selectedKeys.value}
                    onSelect={(data: OnSelectedData) => {
                        selectedKeys.value = data.selectedKeys;
                    }}
                />
            ),
        });
        await userEvent.click(itemText('任务平台'));
        await userEvent.click(await screen.findByText('任务管理'));
        const subs = container.querySelectorAll(`.${prefix}-list > li.${prefix}-item-sub > .${prefix}-sub-title`);
        await waitFor(() => expect(subs[1]).toHaveAttribute('aria-expanded', 'true'));
        expect(subs[2]).toHaveAttribute('aria-expanded', 'true');
    });
});
