import React, { StrictMode, createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { ConfigProvider, TabPane, Tabs } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { TabBarProps, TabContextValue, TabPaneProps, TabsProps } from '../interface';

// jsdom has no layout, so these tests assert the native scrollIntoView path; the fallback is covered by supports.test.ts
vi.mock('@fibrae/semi-foundation/utils/supports', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@fibrae/semi-foundation/utils/supports')>()),
    scrollIntoViewWithin: (el: Element, _scroller: HTMLElement, options: ScrollIntoViewOptions) => el.scrollIntoView({ ...options, container: 'nearest' } as ScrollIntoViewOptions),
}));

let defaultTabPane = [
    { itemKey: 'itemKeyA', tab: 'titleA', children: 'contentA' },
    { itemKey: 'itemKeyB', tab: 'titleB', children: 'contentB' },
];

let ACTIVE = `.${BASE_CLASS_PREFIX}-tabs-tab-active`;

function getTabs(tabProps?: TabsProps, tabPaneProps: TabPaneProps[] = defaultTabPane) {
    let tabPane = tabPaneProps.map((pane) => {
        return <TabPane {...pane} key={pane.itemKey} />;
    });
    return <Tabs {...tabProps}>{tabPane}</Tabs>;
}

const getActiveTab = (container) => container.querySelector(ACTIVE);
const getBar = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar`);

describe('Tabs', () => {
    it('基础渲染 tabs', () => {
        const { container } = render(getTabs({}, defaultTabPane));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-content`).children).toHaveLength(2);
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(2);
        expect(getActiveTab(container)).toHaveTextContent(/^titleA$/);
        expect(screen.getByRole('tab', { name: 'titleA' })).toHaveAttribute('aria-selected', 'true');
    });

    it('Tabs 带自定义 className、style 和 contentStyle', () => {
        let props = {
            className: 'test',
            style: {
                color: 'red',
            },
        };
        const { container } = render(getTabs(props));
        const tabs = container.querySelector('div.test');
        expect(tabs).not.toBeNull();
        expect(tabs).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Tabs 带 defaultActiveKey', () => {
        const { container } = render(getTabs({ defaultActiveKey: 'itemKeyB' }));
        expect(getActiveTab(container)).toHaveTextContent(/^titleB$/);
    });

    it('不同类型的 Tabs', () => {
        const typeOf = (type) => {
            const { container, unmount } = render(getTabs({ type }));
            const result = {
                button: container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-button`) !== null,
                card: container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-card`) !== null,
            };
            unmount();
            return result;
        };
        expect(typeOf('line')).toEqual({ button: false, card: false });
        expect(typeOf('card')).toEqual({ button: false, card: true });
        expect(typeOf('button')).toEqual({ button: true, card: false });
    });

    it('tabList', () => {
        let tabList = [
            { tab: '文档', itemKey: '1' },
            { tab: '快速起步', itemKey: '2' },
            { tab: '帮助', itemKey: '3' },
        ];
        const contentList = [<div key="1">文档</div>, <div key="2">快速起步</div>, <div key="3">帮助</div>];

        class TabListDemo extends React.Component {
            override state = {
                key: '1',
            };

            override render() {
                return <Tabs tabList={tabList}>{contentList[Number(this.state.key) - 1]}</Tabs>;
            }
        }

        const { container } = render(<TabListDemo />);
        const content = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-content`);
        expect(content.children).toHaveLength(1);
        expect(content).toHaveTextContent(/^文档$/);
        expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['文档', '快速起步', '帮助']);
    });

    it('点击禁用的面板时不切换', async () => {
        const spyOnChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        let tabProps = {
            defaultActiveKey: 'itemKeyA',
            onChange: spyOnChange,
        };
        let tabPaneProps = [
            { itemKey: 'itemKeyA', tab: 'titleA' },
            { itemKey: 'itemKeyB', tab: 'titleB', disabled: true },
        ];
        const { container } = render(getTabs(tabProps, tabPaneProps));
        const disabledTabs = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tabs-tab-disabled`);
        expect(disabledTabs).toHaveLength(1);
        expect(disabledTabs[0]).toHaveTextContent(/^titleB$/);

        await userEvent.click(screen.getByRole('tab', { name: 'titleB' }));
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(getActiveTab(container)).toHaveTextContent(/^titleA$/);
    });

    it('onChange、onTabClick 显式为 null 时点击标签照常切换', async () => {
        render(getTabs({ onChange: null, onTabClick: null }));
        await userEvent.click(screen.getByRole('tab', { name: 'titleB' }));
        expect(screen.getByRole('tab', { name: 'titleB' })).toHaveAttribute('aria-selected', 'true');
    });

    it('onTabClick', async () => {
        const spyOnTabClick = vi.fn<NonNullable<TabsProps['onTabClick']>>();
        render(getTabs({ onTabClick: spyOnTabClick }));
        await userEvent.click(screen.getByRole('tab', { name: 'titleB' }));
        expect(spyOnTabClick).toHaveBeenCalledTimes(1);
        expect(spyOnTabClick.mock.calls[0][0]).toBe('itemKeyB');
    });

    it('onChange', async () => {
        const spyOnChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const { container } = render(getTabs({ onChange: spyOnChange }, defaultTabPane));
        await userEvent.click(screen.getByRole('tab', { name: 'titleB' }));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith('itemKeyB');
        expect(getActiveTab(container)).toHaveTextContent(/^titleB$/);
    });

    it('activeKey 变化时更新', () => {
        const { container, rerender } = render(getTabs({ activeKey: 'itemKeyA' }, defaultTabPane));
        expect(getActiveTab(container)).toHaveTextContent(/^titleA$/);
        rerender(getTabs({ activeKey: 'itemKeyB' }, defaultTabPane));
        expect(getActiveTab(container)).toHaveTextContent(/^titleB$/);
    });

    it('tabList 从空数组变为非空后，非受控的 Tabs 选中第一个可用页签', () => {
        const list = [
            { itemKey: 'a', tab: '甲', disabled: true },
            { itemKey: 'b', tab: '乙' },
        ];
        const { rerender } = render(<Tabs tabList={[]} />);
        rerender(<Tabs tabList={list} />);
        expect(screen.getByRole('tab', { name: '乙' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: '甲' })).toHaveAttribute('aria-selected', 'false');
    });

    it('类型：TabBarProps 不再有 closable，TabPaneTransitionProps 不再导出', () => {
        expectTypeOf<TabBarProps>().not.toHaveProperty('closable');
        // @ts-expect-error the type was removed
        expectTypeOf<import('../interface').TabPaneTransitionProps>().toBeAny();
    });

    it('contentStyle', () => {
        const { container } = render(getTabs({ contentStyle: { color: 'red' } }, defaultTabPane));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-content`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('tabpane 的 closable', async () => {
        const Demo = () => {
            const [tabList, $tabList] = useState([
                { tab: '文档', itemKey: '1', text: '文档', closable: true },
                { tab: '快速起步', itemKey: '2', text: '快速起步', closable: true },
                { tab: '帮助', itemKey: '3', text: '帮助' },
            ]);
            const close = (key) => {
                const newTabList = [...tabList];
                const closeIndex = newTabList.findIndex((t) => t.itemKey === key);
                newTabList.splice(closeIndex, 1);
                $tabList(newTabList);
            };
            return (
                <Tabs type="card" defaultActiveKey="1" onTabClose={close}>
                    {tabList.map((t) => (
                        <TabPane key={t.itemKey} closable={t.closable} itemKey={t.itemKey} tab={t.tab}>
                            {t.text}
                        </TabPane>
                    ))}
                </Tabs>
            );
        };

        const { container } = render(<Demo />);
        const closeSelector = `.${BASE_CLASS_PREFIX}-tabs-tab-icon-close`;
        const [firstTab, secondTab, thirdTab] = screen.getAllByRole('tab');

        expect(firstTab.querySelector(closeSelector)).not.toBeNull();
        expect(secondTab.querySelector(closeSelector)).not.toBeNull();
        expect(thirdTab.querySelector(closeSelector)).toBeNull();

        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Tabs.close })[0]);

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);
        expect(tabs[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-tab-active`);
        expect(tabs[0]).toHaveTextContent(/^快速起步$/);
        expect(getActiveTab(container)).toBe(tabs[0]);
    });

    it('Fragment 里的 TabPane 是页签，其他子节点仍按内容渲染', () => {
        render(
            <Tabs>
                <TabPane itemKey="a" tab="A" />
                <>
                    <TabPane itemKey="b" tab="B" />
                    <span>fragment-content</span>
                </>
            </Tabs>
        );
        expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['A', 'B']);
        expect(screen.getByText('fragment-content')).toBeInTheDocument();
    });

    it('TabPane 以 elementType 标识自身', () => {
        expect(TabPane.elementType).toBe('Tabs.TabPane');
        // @ts-expect-error TabPane has no isTabPane marker
        expect(TabPane.isTabPane).toBeUndefined();
    });

    it('tabbar 首次渲染正确', () => {
        const { container } = render(getTabs({}));
        expect(container).toHaveTextContent('titleA');
        expect(container).toHaveTextContent('titleB');
        expect(screen.getByRole('tablist')).toHaveTextContent(/^titleAtitleB$/);
    });

    it('两个 Tabs 共用 itemKey 时，各面板由各自的标签标识', () => {
        render(
            <>
                {getTabs({ defaultActiveKey: 'itemKeyA' }, [{ itemKey: 'itemKeyA', tab: 'first', children: 'one' }])}
                {getTabs({ defaultActiveKey: 'itemKeyA' }, [{ itemKey: 'itemKeyA', tab: 'second', children: 'two' }])}
            </>
        );
        const [firstPanel, secondPanel] = screen.getAllByRole('tabpanel');
        expect(firstPanel).toHaveAccessibleName('first');
        expect(secondPanel).toHaveAccessibleName('second');
        const [firstTab, secondTab] = screen.getAllByRole('tab');
        expect(firstTab.getAttribute('aria-controls')).toBe(firstPanel.id);
        expect(secondTab.getAttribute('aria-controls')).toBe(secondPanel.id);
    });

    it('使用 tabList 时，内容区域为所选标签控制的面板', () => {
        render(
            <Tabs
                defaultActiveKey="2"
                tabList={[
                    { tab: 'Document', itemKey: '1' },
                    { tab: 'Help', itemKey: '2' },
                ]}
            >
                <div>content</div>
            </Tabs>
        );
        const panel = screen.getByRole('tabpanel');
        expect(screen.getByRole('tab', { selected: true }).getAttribute('aria-controls')).toBe(panel.id);
        expect(panel).toHaveAccessibleName('Help');
        expect(panel).toHaveTextContent('content');
    });

    it('通过 renderTabBar 渲染的 TabItem 控制其所在 Tabs 的面板', () => {
        render(
            getTabs(
                {
                    defaultActiveKey: 'itemKeyA',
                    renderTabBar: ({ list, activeKey }) => (
                        <div role="tablist">
                            {list.map((item) => (
                                <Tabs.TabItem key={item.itemKey} itemKey={item.itemKey} selected={item.itemKey === activeKey} tab={item.tab} />
                            ))}
                        </div>
                    ),
                },
                [{ itemKey: 'itemKeyA', tab: 'custom', children: 'content' }]
            )
        );
        expect(screen.getByRole('tabpanel')).toHaveAccessibleName('custom');
    });
});

const threePanes = [
    { itemKey: 'a', tab: 'A', children: 'content a' },
    { itemKey: 'b', tab: 'B', children: 'content b' },
    { itemKey: 'c', tab: 'C', children: 'content c' },
];
const tab = (name) => screen.getByRole('tab', { name });
const tabNames = () => screen.getAllByRole('tab').map((t) => t.textContent);
const selectedTab = () => screen.queryByRole('tab', { selected: true })?.textContent ?? null;
const paneOf = (container, itemKey) => container.querySelector(`[role="tabpanel"][id$="-panel-${itemKey}"]`);
const overlayClass = (container, itemKey) => paneOf(container, itemKey).querySelector(`.${BASE_CLASS_PREFIX}-tabs-pane-motion-overlay`).className;

// Records which nodes each observer watches; `intersect` reports visibility by scroll key to every live observer.
function stubIntersectionObserver() {
    const observers = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            callback: unknown;
            elements: Set<Element>;
            constructor(callback) {
                this.callback = callback;
                this.elements = new Set();
                observers.push(this);
            }
            observe(element) {
                this.elements.add(element);
            }
            unobserve(element) {
                this.elements.delete(element);
            }
            disconnect() {
                this.elements.clear();
            }
            takeRecords() {
                return [];
            }
        }
    );
    const live = () => observers.filter((observer) => observer.elements.size > 0);
    return {
        observed: () => live().flatMap((observer) => [...observer.elements]),
        intersect: (visibility) =>
            act(() => {
                live().forEach((observer) =>
                    observer.callback(
                        [...observer.elements].map((target) => ({
                            target,
                            isIntersecting: Boolean(visibility[target.dataset.scrollkey]),
                            boundingClientRect: { y: 0 },
                        }))
                    )
                );
            }),
    };
}

describe('Tabs 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        // jsdom has no scrollIntoView; the collapsible tests install a mock
        delete Element.prototype.scrollIntoView;
    });

    it('onTabClick 接收 key 和事件；点击已选中的标签不调用 onChange', async () => {
        const onTabClick = vi.fn<NonNullable<TabsProps['onTabClick']>>();
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        render(getTabs({ onTabClick, onChange }, threePanes));
        await userEvent.click(tab('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(onTabClick).toHaveBeenCalledTimes(1);
        expect(onTabClick.mock.lastCall[0]).toBe('a');
        expect(onTabClick.mock.lastCall[1]).toMatchObject({ type: 'click' });
        await userEvent.click(tab('C'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
        expect(onTabClick.mock.lastCall[0]).toBe('c');
    });

    it('键盘激活时 onTabClick 收到 keydown 事件，类型为鼠标与键盘事件的联合', async () => {
        const onTabClick = vi.fn<NonNullable<TabsProps['onTabClick']>>();
        render(getTabs({ onTabClick }, threePanes));
        act(() => tab('B').focus());
        await userEvent.keyboard('{Enter}');
        expect(onTabClick).toHaveBeenCalledExactlyOnceWith('b', expect.objectContaining({ type: 'keydown' }));
        expectTypeOf<Parameters<NonNullable<TabsProps['onTabClick']>>[1]>().toEqualTypeOf<React.MouseEvent | React.KeyboardEvent>();
    });

    it('受控时点击只报告 key；移除 activeKey 后从最后的受控 key 继续', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const { rerender } = render(getTabs({ activeKey: 'a', onChange }, threePanes));
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('A');
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledTimes(2);

        rerender(getTabs({ activeKey: 'c', onChange }, threePanes));
        expect(selectedTab()).toBe('C');
        rerender(getTabs({ onChange }, threePanes));
        expect(selectedTab()).toBe('C');
        await userEvent.click(tab('A'));
        expect(onChange).toHaveBeenLastCalledWith('a');
        expect(selectedTab()).toBe('A');
    });

    it('activeKey={undefined} 按非受控处理：取 defaultActiveKey，点击即切换', async () => {
        render(getTabs({ activeKey: undefined, defaultActiveKey: 'b' }, threePanes));
        expect(selectedTab()).toBe('B');
        await userEvent.click(tab('C'));
        expect(selectedTab()).toBe('C');
    });

    it('activeKey={null} 不选中任何标签，也不抛错，点击仍只报告 key', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        render(getTabs({ activeKey: null, onChange }, threePanes));
        expect(selectedTab()).toBeNull();
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledWith('b');
        expect(selectedTab()).toBeNull();
    });

    it('keepDOM={false} 时只渲染所选面板', async () => {
        render(getTabs({ keepDOM: false }, threePanes));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content a$/);
        await userEvent.click(tab('C'));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content c$/);
    });

    it('lazyRender 在面板首次激活时渲染，之后保留', async () => {
        render(getTabs({ lazyRender: true }, threePanes));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
        expect(screen.getByText('content a')).toBeInTheDocument();
        expect(screen.queryByText('content b')).toBeNull();
        await userEvent.click(tab('B'));
        expect(screen.getByText('content b')).toBeInTheDocument();
        await userEvent.click(tab('A'));
        expect(screen.getByText('content b')).toBeInTheDocument();
        expect(screen.queryByText('content c')).toBeNull();
    });

    it('type、size 和 tabPosition 在根节点、标签栏、标签和内容上设置类名', () => {
        const { container, unmount } = render(getTabs({}, threePanes));
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
        expect(container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-tabs`, `${BASE_CLASS_PREFIX}-tabs-top`);
        expect(tab('A')).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-tab-line`, `${BASE_CLASS_PREFIX}-tabs-tab-top`, `${BASE_CLASS_PREFIX}-tabs-tab-single`);
        unmount();

        const { container: left } = render(getTabs({ tabPosition: 'left', size: 'small', type: 'card' }, threePanes));
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
        expect(getBar()).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar`, `${BASE_CLASS_PREFIX}-tabs-bar-card`, `${BASE_CLASS_PREFIX}-tabs-bar-left`);
        expect(left.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-left`);
        expect(left.querySelector(`.${BASE_CLASS_PREFIX}-tabs-content`)).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-content-left`);
        expect(tab('A')).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-tab-card`, `${BASE_CLASS_PREFIX}-tabs-tab-left`, `${BASE_CLASS_PREFIX}-tabs-tab-small`);
        expect(tab('A')).not.toHaveClass(`${BASE_CLASS_PREFIX}-tabs-tab-medium`);
    });

    it('roving tabindex，以及标签与面板之间的 aria 关联', () => {
        const panes = threePanes.map((pane) => (pane.itemKey === 'b' ? { ...pane, disabled: true } : pane));
        render(getTabs({}, panes));
        expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1, -1]);
        expect(tab('B')).toHaveAttribute('aria-disabled', 'true');
        expect(tab('A')).toHaveAttribute('aria-disabled', 'false');
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        expect(panels.map((p) => p.getAttribute('aria-hidden'))).toEqual(['false', 'true', 'true']);
        expect(panels.map((p) => p.tabIndex)).toEqual([0, 0, 0]);
        screen.getAllByRole('tab').forEach((t, i) => {
            expect(t.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(t.id);
        });
        expect(new Set(panels.map((p) => p.id)).size).toBe(3);
    });

    it('只有面板在文档中时，标签才指向该面板', () => {
        const { unmount } = render(<Tabs tabList={threePanes.map(({ children, ...tabItem }) => tabItem)}>content</Tabs>);
        const panel = screen.getByRole('tabpanel');
        expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-controls'))).toEqual([panel.id, null, null]);
        unmount();

        render(getTabs({ keepDOM: false }, threePanes));
        const pane = screen.getByRole('tabpanel');
        expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-controls'))).toEqual([pane.id, null, null]);
    });

    it('键盘：方向键跳过禁用标签并循环移动，Home 和 End 跳转，Enter 选择', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const panes = [...threePanes, { itemKey: 'd', tab: 'D', disabled: true }, { itemKey: 'e', tab: 'E' }];
        render(
            getTabs(
                { onChange },
                panes.map((p) => (p.itemKey === 'c' ? { ...p, disabled: true } : p))
            )
        );
        act(() => tab('B').focus());
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('E')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('A')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('E')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tab('E')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(tab('A')).toHaveFocus();
        await userEvent.keyboard('{End}');
        expect(tab('E')).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('e');
        expect(selectedTab()).toBe('E');
        act(() => tab('A').focus());
        await userEvent.keyboard(' ');
        expect(selectedTab()).toBe('A');
    });

    it('键盘：RTL 页面中，水平标签栏的左右方向键互换', async () => {
        render(<ConfigProvider direction="rtl">{getTabs({}, threePanes)}</ConfigProvider>);
        act(() => tab('A').focus());
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(tab('C')).toHaveFocus();
    });

    it('键盘：垂直标签栏使用上下方向键', async () => {
        render(getTabs({ tabPosition: 'left' }, threePanes));
        act(() => tab('A').focus());
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('A')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        expect(tab('C')).toHaveFocus();
    });

    it('closable：关闭图标和 Backspace 调用 onTabClose，而非 onTabClick', async () => {
        const onTabClose = vi.fn<NonNullable<TabsProps['onTabClose']>>();
        const onTabClick = vi.fn<NonNullable<TabsProps['onTabClick']>>();
        render(
            getTabs(
                { onTabClose, onTabClick },
                threePanes.map((p) => ({ ...p, closable: p.itemKey !== 'c' }))
            )
        );
        expect(screen.getAllByRole('button', { name: zh_CN.Tabs.close })).toHaveLength(2);
        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Tabs.close })[1]);
        expect(onTabClose).toHaveBeenCalledExactlyOnceWith('b');
        expect(onTabClick).not.toHaveBeenCalled();

        act(() => tab('A').focus());
        await userEvent.keyboard('{Backspace}');
        expect(onTabClose).toHaveBeenLastCalledWith('a');
        expect(tab('B')).toHaveFocus();
        act(() => tab('C').focus());
        await userEvent.keyboard('{Delete}');
        expect(onTabClose).toHaveBeenCalledTimes(2);
    });

    it('tabBarExtraContent 位于标签栏中 tablist 之外，浮动到行尾并保留自身样式', () => {
        const { container } = render(getTabs({ tabBarExtraContent: <button style={{ color: 'red' }}>Extra</button> }, threePanes));
        const extra = container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tabs-bar-extra`);
        expect(getBar()).toContainElement(extra);
        expect(screen.getByRole('tablist')).not.toContainElement(extra);
        expect(extra).toHaveAttribute('x-semi-prop', 'tabBarExtraContent');
        expect(extra).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar-line-extra`, `${BASE_CLASS_PREFIX}-tabs-bar-line-extra-large`);
        expect(extra).toHaveStyle({ float: 'inline-end' });
        expect(extra.style.color).toBe('');
        expect(screen.getByRole('button', { name: 'Extra' })).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('标签内控件的按键不触发标签的键盘操作', async () => {
        const onTabClose = vi.fn<NonNullable<TabsProps['onTabClose']>>();
        const onTabClick = vi.fn<NonNullable<TabsProps['onTabClick']>>();
        const panes = [{ itemKey: 'a', tab: <input aria-label="name" />, closable: true, children: 'content a' }, ...threePanes.slice(1)];
        render(getTabs({ onTabClose, onTabClick }, panes));
        const input = screen.getByRole('textbox', { name: 'name' });
        await userEvent.click(input);
        onTabClick.mockClear();
        await userEvent.keyboard('a b');
        expect(input).toHaveValue('a b');
        await userEvent.keyboard('{Home}{Backspace}{ArrowRight}{End}');
        expect(input).toHaveFocus();
        expect(onTabClose).not.toHaveBeenCalled();
        expect(onTabClick).not.toHaveBeenCalled();
    });

    it('tabBarExtraContent 元素的 float 由外层继承', () => {
        const { container } = render(getTabs({ tabBarExtraContent: <button style={{ float: 'left' }}>Extra</button> }, threePanes));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-extra`)).toHaveStyle({ float: 'left' });
    });

    it('renderTabBar 接收标签栏属性和默认 TabBar', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const renderTabBar = vi.fn<NonNullable<TabsProps['renderTabBar']>>((props, DefaultTabBar) => (
            <div className="wrap">
                <DefaultTabBar {...props} data-bar="custom" />
            </div>
        ));
        const { container } = render(getTabs({ renderTabBar, onChange, tabBarClassName: 'bar', tabBarStyle: { color: 'red' } }, threePanes));
        expect(renderTabBar.mock.lastCall[0]).toMatchObject({
            activeKey: 'a',
            className: 'bar',
            style: { color: 'red' },
            size: 'large',
            type: 'line',
            tabPosition: 'top',
            list: [
                { itemKey: 'a', tab: 'A' },
                { itemKey: 'b', tab: 'B' },
                { itemKey: 'c', tab: 'C' },
            ],
        });
        const bar = container.querySelector(`.wrap .${BASE_CLASS_PREFIX}-tabs-bar`);
        expect(bar).toHaveClass('bar');
        expect(bar).toHaveAttribute('data-bar', 'custom');
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(renderTabBar.mock.lastCall[0].activeKey).toBe('b');
    });

    it('data-* 属性传到根节点和面板', () => {
        const { container } = render(
            <Tabs data-testid="tabs">
                <TabPane data-pane="a" itemKey="a" tab="A">
                    a
                </TabPane>
            </Tabs>
        );
        expect(container.firstChild).toHaveAttribute('data-testid', 'tabs');
        expect(screen.getByRole('tabpanel')).toHaveAttribute('data-pane', 'a');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Tabs: { type: 'card', size: 'small' } };
        const { rerender } = render(getTabs({}, threePanes));
        expect(getBar()).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar-card`);
        expect(tab('A')).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-tab-small`);
        rerender(getTabs({ type: 'button' }, threePanes));
        expect(getBar()).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar-button`);
        expect(tab('A')).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-tab-small`);
    });

    it('StrictMode 下正常工作：每次点击只调用一次 onChange', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const { container } = render(<StrictMode>{getTabs({ onChange }, threePanes)}</StrictMode>);
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('B');
        expect(overlayClass(container, 'b')).toContain(`${BASE_CLASS_PREFIX}-tabs-pane-animate-leftShow`);
    });

    it('more：最后的标签收进下拉菜单，可按数量或自定义触发器展示', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const { unmount } = render(getTabs({ more: 1, onChange }, threePanes));
        expect(tabNames()).toEqual(['A', 'B']);
        expect(screen.getByText('更多')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).not.toContainElement(screen.getByText('更多'));
        unmount();

        render(getTabs({ more: { count: 2, dropdownProps: { trigger: 'click' } }, onChange }, threePanes));
        expect(tabNames()).toEqual(['A']);
        await userEvent.click(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items.map((item) => item.textContent)).toEqual(['B', 'C']);
        await userEvent.click(items[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
    });

    it('more：默认触发器是 button，Tab 聚焦，Enter 或 Space 打开', async () => {
        render(getTabs({ more: 2 }, threePanes));
        const trigger = screen.getByRole('button', { name: '更多' });
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');

        await userEvent.tab();
        await userEvent.tab();
        expect(trigger).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(2);
        await vi.waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });

    it('more：Space 在默认触发器上打开下拉菜单', async () => {
        render(getTabs({ more: 2 }, threePanes));
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.keyboard(' ');
        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(2);
    });

    it('more：自定义渲染替换触发器，错误的格式会抛出异常', () => {
        const { unmount } = render(getTabs({ more: { count: 5, render: () => <span>custom more</span> } }, threePanes));
        expect(screen.getByText('custom more')).toBeInTheDocument();
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        unmount();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        // a string is not a valid `more`; the runtime must reject it
        const invalidMore = { more: 'many' } as unknown as TabsProps;
        expect(() => render(getTabs(invalidMore, threePanes))).toThrow('[Semi Tabs]: invalid tab props format: more');
    });

    it('collapsible：隐藏的标签进入箭头下拉菜单，选中后滚动到可见区域', async () => {
        const scrollIntoView = vi.fn<Element['scrollIntoView']>();
        Element.prototype.scrollIntoView = scrollIntoView;
        const io = stubIntersectionObserver();
        const onVisibleTabsChange = vi.fn<NonNullable<TabsProps['onVisibleTabsChange']>>();
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const panes = ['k0', 'k1', 'k2', 'k3', 'k4'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        const { container } = render(
            getTabs(
                {
                    collapsible: true,
                    onVisibleTabsChange,
                    onChange,
                    visibleTabsStyle: { color: 'red' },
                    dropdownProps: { end: { trigger: 'click' } },
                },
                panes
            )
        );
        const arrow = (pos) => container.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tabs-bar-arrow-${pos}`);
        const arrowButton = (pos) => arrow(pos).querySelector('button');
        expect(getBar()).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar-collapse`);
        expect(screen.getByRole('tablist')).toBe(container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`));
        expect(screen.getByRole('tablist')).not.toContainElement(arrow('start'));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`)).toHaveStyle({
            color: 'rgb(255, 0, 0)',
        });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(panes.map((p) => `${p.itemKey}-bar`));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeDisabled();

        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect([...onVisibleTabsChange.mock.lastCall[0]]).toEqual(panes.map((p, i) => [p.itemKey, i < 2]));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeEnabled();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k0'));
        expect(scrollIntoView.mock.lastCall[0]).toEqual({ behavior: 'auto', block: 'nearest', inline: 'nearest', container: 'nearest' });

        await userEvent.click(arrowButton('end'));
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k2'));
        expect(scrollIntoView.mock.lastCall[0]).toEqual({ behavior: 'smooth', block: 'nearest', inline: 'nearest', container: 'nearest' });
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items.map((item) => item.textContent)).toEqual(['tab-k2', 'tab-k3', 'tab-k4']);

        const calls = scrollIntoView.mock.calls.length;
        await userEvent.click(items[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith('k3');
        expect(selectedTab()).toBe('tab-k3');
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k3'));
        expect(scrollIntoView.mock.calls.length).toBe(calls + 1);
    });

    it('collapsible：箭头按钮上按 Enter 和 Space 每次滚动一个标签', async () => {
        const scrollIntoView = vi.fn<Element['scrollIntoView']>();
        Element.prototype.scrollIntoView = scrollIntoView;
        const io = stubIntersectionObserver();
        const panes = ['k0', 'k1', 'k2', 'k3', 'k4'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        render(getTabs({ collapsible: true }, panes));
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        const next = screen.getByRole('button', { name: zh_CN.Tabs.nextTabs });
        act(() => next.focus());
        scrollIntoView.mockClear();

        await userEvent.keyboard('{Enter}');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
        await userEvent.keyboard(' ');
        expect(scrollIntoView).toHaveBeenCalledTimes(2);
        expect(scrollIntoView.mock.contexts[1]).toBe(tab('tab-k3'));
    });

    it('collapsible：两个箭头按钮（无论是否禁用）都有可访问名称', () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        const io = stubIntersectionObserver();
        const panes = ['k0', 'k1', 'k2'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        render(getTabs({ collapsible: true }, panes));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeDisabled();
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeEnabled();
    });

    it('collapsible="auto"：观察到标签栏溢出时折叠', () => {
        stubIntersectionObserver();
        const observers = [];
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: unknown;
                targets: Element[];
                constructor(callback) {
                    this.callback = callback;
                    this.targets = [];
                    observers.push(this);
                }
                observe(target) {
                    this.targets.push(target);
                }
                unobserve(target) {
                    this.targets = this.targets.filter((item) => item !== target);
                }
                disconnect() {
                    this.targets = [];
                }
            }
        );
        render(getTabs({ collapsible: 'auto' }, threePanes));
        const bar = getBar();
        const observer = observers.find((item) => item.targets.length);
        expect(observer.targets).toEqual([bar]);
        expect(bar).not.toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar-collapse`);

        Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 300 });
        Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 100 });
        void act(() => observer.callback([{ target: bar }]));

        expect(getBar()).toHaveClass(`${BASE_CLASS_PREFIX}-tabs-bar-collapse`);
    });

    it('collapsible：renderArrow、arrowPosition 和 showRestInDropdown={false}', async () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        const io = stubIntersectionObserver();
        const renderArrow = vi.fn<NonNullable<TabsProps['renderArrow']>>((items, pos, _handleArrowClick, defaultNode) => (
            <span className={`custom-${pos}`}>
                {items.length}
                {defaultNode}
            </span>
        ));
        const panes = ['k0', 'k1', 'k2'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        const { container } = render(getTabs({ collapsible: true, renderArrow, arrowPosition: 'end', showRestInDropdown: false }, panes));
        io.intersect({ 'k0-bar': true });
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`);
        expect(list.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(container.querySelector('.custom-start')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.custom-end')).toHaveTextContent(/^2$/);
        expect(renderArrow.mock.lastCall[1]).toBe('end');
        await userEvent.click(container.querySelector(`.custom-end .${BASE_CLASS_PREFIX}-tabs-bar-arrow`));
        expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
        expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(tab('tab-k1'));
    });

    it('collapsible：受控的 activeKey 变化时滚动使标签可见', () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        stubIntersectionObserver();
        const panes = ['k0', 'k1', 'k2'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        const { rerender } = render(getTabs({ collapsible: true, activeKey: 'k0' }, panes));
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
        rerender(getTabs({ collapsible: true, activeKey: 'k2' }, panes));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0]).toBe(tab('tab-k2'));
    });

    it('collapsible：itemKey 含双引号与空格时切换不抛错，标签与面板的 id 一一对应', () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        stubIntersectionObserver();
        const panes = ['a "b"', 'c d'].map((key) => ({ itemKey: key, tab: `tab-${key}`, children: key }));
        const { rerender } = render(getTabs({ collapsible: true, activeKey: 'a "b"' }, panes));
        expect(() => rerender(getTabs({ collapsible: true, activeKey: 'c d' }, panes))).not.toThrow();
        expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(tab('tab-c d'));
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        screen.getAllByRole('tab').forEach((t, i) => {
            // an id holding a space would be read as two IDREFs
            expect(t.id).not.toMatch(/\s/);
            expect(panels[i].id).not.toMatch(/\s/);
            expect(t.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(t.id);
        });
    });

    it('children 变化：新增面板时选中第一个；删除已选中的面板时回退到第一个', () => {
        const { rerender } = render(<Tabs>{[]}</Tabs>);
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        rerender(getTabs({}, threePanes));
        expect(selectedTab()).toBe('A');

        rerender(getTabs({}, threePanes.slice(1)));
        expect(selectedTab()).toBe('B');
    });

    it('children 模式移除当前面板时，回退到第一个启用的面板', () => {
        const panes = threePanes.map((p) => (p.itemKey === 'a' ? { ...p, disabled: true } : p));
        const { rerender } = render(getTabs({ defaultActiveKey: 'c' }, panes));
        expect(selectedTab()).toBe('C');
        rerender(getTabs({ defaultActiveKey: 'c' }, panes.slice(0, 2)));
        expect(selectedTab()).toBe('B');
    });

    it('tabList 模式移除当前 key 后，选中第一个启用的页签', () => {
        const list = threePanes.map(({ itemKey, tab: t }) => ({ itemKey, tab: t, disabled: itemKey === 'a' }));
        const { rerender } = render(<Tabs defaultActiveKey="c" tabList={list} />);
        expect(selectedTab()).toBe('C');
        rerender(<Tabs defaultActiveKey="c" tabList={list.slice(0, 2)} />);
        expect(tabNames()).toEqual(['A', 'B']);
        expect(selectedTab()).toBe('B');
    });

    it('defaultActiveKey 不在页签中时不选中任何面板', () => {
        render(getTabs({ defaultActiveKey: 'zzz' }, threePanes));
        expect(selectedTab()).toBeNull();
    });

    it('motion：所选面板从上一个标签的一侧滑入', async () => {
        const { container } = render(getTabs({}, threePanes));
        const animate = (dir) => `${BASE_CLASS_PREFIX}-tabs-pane-animate-${dir}Show`;
        expect(overlayClass(container, 'a')).not.toContain('animate');
        await userEvent.click(tab('C'));
        expect(overlayClass(container, 'c')).toContain(animate('left'));
        expect(overlayClass(container, 'a')).not.toContain('animate');
        await userEvent.click(tab('B'));
        expect(overlayClass(container, 'b')).toContain(animate('right'));
    });

    it('motion：垂直标签栏上下滑动，tabPaneMotion={false} 时关闭动画', async () => {
        const animate = (dir) => `${BASE_CLASS_PREFIX}-tabs-pane-animate-${dir}Show`;
        const { container, unmount } = render(getTabs({ tabPosition: 'left' }, threePanes));
        await userEvent.click(tab('B'));
        expect(overlayClass(container, 'b')).toContain(animate('top'));
        await userEvent.click(tab('A'));
        expect(overlayClass(container, 'a')).toContain(animate('bottom'));
        unmount();

        const { container: still } = render(getTabs({ tabPaneMotion: false }, threePanes));
        await userEvent.click(tab('B'));
        expect(overlayClass(still, 'b')).not.toContain('animate');
    });

    it('motion：新增并同时选中的面板，或删除所选面板后，不播放动画', () => {
        const animate = `${BASE_CLASS_PREFIX}-tabs-pane-animate`;
        const two = threePanes.slice(0, 2);
        const { container, rerender } = render(getTabs({ activeKey: 'a' }, two));
        rerender(getTabs({ activeKey: 'b' }, two));
        expect(overlayClass(container, 'b')).toContain(animate);
        rerender(getTabs({ activeKey: 'c' }, threePanes));
        expect(selectedTab()).toBe('C');
        expect(overlayClass(container, 'c')).not.toContain(animate);

        rerender(getTabs({}, threePanes));
        rerender(getTabs({}, two));
        expect(selectedTab()).toBe('A');
        expect(overlayClass(container, 'a')).not.toContain(animate);
    });

    it('TabItem 把 ref 转发到标签元素', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Tabs renderTabBar={() => <Tabs.TabItem ref={ref} itemKey="a" selected tab="A" />}>
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        );
        expect(ref.current).toBe(tab('A'));
    });

    it('TabItem 的 role、tabIndex 和 aria 状态优先于透传属性，并合并 className 和 style', () => {
        // spread so that the lint rules about role and tabIndex do not apply to this deliberate conflict
        const passthrough = {
            role: 'button',
            tabIndex: 5,
            'aria-selected': false,
            className: 'extra',
            style: { opacity: 0.5 },
            'data-x': '1',
        };
        render(
            <Tabs renderTabBar={() => <Tabs.TabItem itemKey="a" selected tab="A" {...passthrough} />}>
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        );
        const el = tab('A');
        expect(el).toHaveAttribute('tabindex', '0');
        expect(el).toHaveAttribute('aria-selected', 'true');
        expect(el).toHaveClass('extra', `${BASE_CLASS_PREFIX}-tabs-tab`);
        expect(el).toHaveStyle({ opacity: '0.5' });
        expect(el).toHaveAttribute('data-x', '1');
    });

    it('renderTabBar 传给 DefaultTabBar 的 ref 指向标签栏，内部 ref 仍正常工作', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Tabs renderTabBar={(barProps, DefaultTabBar) => <DefaultTabBar {...barProps} ref={ref} />}>
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        );
        expect(ref.current).toBe(getBar());
    });

    it('Tabs 外部的 TabItem 没有悬空的 id 或 aria-controls', () => {
        render(<Tabs.TabItem itemKey="a" tab="A" />);
        expect(tab('A')).not.toHaveAttribute('id');
        expect(tab('A')).not.toHaveAttribute('aria-controls');
    });

    it('ref 指向根 div 和面板 div', () => {
        const ref = createRef<HTMLDivElement>();
        const paneRef = createRef<HTMLDivElement>();
        const { container } = render(
            <Tabs ref={ref}>
                <TabPane ref={paneRef} itemKey="a" tab="A" />
            </Tabs>
        );
        expect(ref.current).toBe(container.firstChild);
        expect(paneRef.current).toBe(screen.getByRole('tabpanel'));
    });

    it('TabPane 的 closable 变化时更新其标签', () => {
        const { rerender } = render(getTabs({}, threePanes));
        expect(screen.queryAllByRole('button', { name: zh_CN.Tabs.close })).toHaveLength(0);
        rerender(
            getTabs(
                {},
                threePanes.map((p) => ({ ...p, closable: p.itemKey === 'b' }))
            )
        );
        expect(screen.getAllByRole('button', { name: zh_CN.Tabs.close })).toHaveLength(1);
    });

    it('未知属性不进入 DOM，面板内部的变化不调用 onChange', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        render(
            <Tabs preventScroll onChange={onChange}>
                <TabPane itemKey="a" tab="A" icon={<span>i</span>}>
                    <input aria-label="field" />
                </TabPane>
            </Tabs>
        );
        await userEvent.type(screen.getByRole('textbox', { name: 'field' }), 'x');
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('tabpanel')).not.toHaveAttribute('tab');
    });

    it('tabList 为空数组时不把 children 当作页签，内容区不引用不存在的 tab', () => {
        const { container } = render(
            <Tabs tabList={[]}>
                <div>content</div>
            </Tabs>
        );
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        expect(screen.queryAllByRole('tabpanel')).toHaveLength(0);
        expect(container.querySelector('[aria-labelledby]')).toBeNull();
        expect(container).toHaveTextContent('content');
    });

    it('tabList 为空数组且 children 是字符串时不抛错', () => {
        render(<Tabs tabList={[]}>text</Tabs>);
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
    });

    it('more：菜单中的禁用页签不能被点选', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const panes = [...threePanes.slice(0, 2), { ...threePanes[2], disabled: true }];
        render(getTabs({ more: 2, onChange }, panes));
        await userEvent.hover(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });

    it('collapsible：箭头菜单中的禁用页签不能被点选', async () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        const io = stubIntersectionObserver();
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        const panes = ['k0', 'k1', 'k2', 'k3'].map((key) => ({
            itemKey: key,
            tab: `tab-${key}`,
            disabled: key === 'k3',
        }));
        render(getTabs({ collapsible: true, onChange }, panes));
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('tab-k0');
    });

    it('禁用页签聚焦后按 Enter 或 Space 不激活', async () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        render(getTabs({ onChange }, [threePanes[0], { ...threePanes[1], disabled: true }]));
        act(() => tab('B').focus());
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });
});

describe('Tabs Tab 停靠点', () => {
    afterEach(() => {
        delete Element.prototype.scrollIntoView;
    });

    it('collapsible：带下拉菜单的箭头外层容器不是 Tab 停靠点', () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        const io = stubIntersectionObserver();
        const panes = ['k0', 'k1', 'k2'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        const { container } = render(getTabs({ collapsible: true }, panes));
        io.intersect({ 'k0-bar': true });
        const arrow = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-arrow-end`);
        expect(arrow.querySelector('button')).toBeEnabled();
        expect(arrow).toHaveAttribute('tabindex', '-1');
    });

    it('collapsible：箭头按钮负责滚动，因此悬停下拉菜单既不描述它，也不将其标记为 menu button', () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        const io = stubIntersectionObserver();
        const panes = ['k0', 'k1', 'k2'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        const { container } = render(getTabs({ collapsible: true }, panes));
        io.intersect({ 'k0-bar': true });
        const arrow = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-arrow-end`);
        for (const node of [arrow, arrow.querySelector('button')]) {
            expect(node).not.toHaveAttribute('aria-describedby');
            expect(node).not.toHaveAttribute('aria-haspopup');
            expect(node).not.toHaveAttribute('aria-expanded');
        }
    });
});

describe('Tabs 批 6 修复', () => {
    it('children 模式只把 TabPane 当作页签，字符串与其他元素是内容', () => {
        const { unmount } = render(
            <Tabs>
                <TabPane itemKey="a" tab="A">
                    pa
                </TabPane>
                <div>extra</div>
            </Tabs>
        );
        expect(screen.getAllByRole('tab')).toHaveLength(1);
        expect(screen.getByText('extra')).toBeInTheDocument();
        unmount();
        expect(() => render(<Tabs>text</Tabs>)).not.toThrow();
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
    });

    it('禁用的 closable 页签：点击关闭图标与 Delete 都不关闭', async () => {
        const onTabClose = vi.fn<NonNullable<TabsProps['onTabClose']>>();
        render(getTabs({ onTabClose }, [threePanes[0], { ...threePanes[1], closable: true, disabled: true }]));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.close }));
        act(() => tab('B').focus());
        await userEvent.keyboard('{Delete}');
        expect(onTabClose).not.toHaveBeenCalled();
    });

    it('TabItem 未传 deleteTabItem 时：Tabs 外点击关闭图标不抛错，renderTabBar 内经 context 关闭', async () => {
        const { unmount } = render(<Tabs.TabItem closable itemKey="a" tab="A" />);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.close }));
        unmount();
        const onTabClose = vi.fn<NonNullable<TabsProps['onTabClose']>>();
        render(
            <Tabs renderTabBar={() => <Tabs.TabItem closable itemKey="a" tab="A" />} onTabClose={onTabClose}>
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        );
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.close }));
        expect(onTabClose).toHaveBeenCalledExactlyOnceWith('a');
    });

    it('TabItem 未传 type、tabPosition 时不输出 undefined 类名', () => {
        render(<Tabs.TabItem itemKey="a" tab="A" />);
        expect(tab('A').className).not.toContain('undefined');
    });

    it('类型：TabBarProps 与 TabContextValue 的 activeKey 可为 null', () => {
        expectTypeOf<TabBarProps['activeKey']>().toEqualTypeOf<string | null | undefined>();
        expectTypeOf<TabContextValue['activeKey']>().toEqualTypeOf<string | null | undefined>();
    });

    it('aria-label 与 aria-labelledby 落到 tablist，其余属性仍落根元素', () => {
        const { container, unmount } = render(
            <Tabs data-x="1" aria-label="Sections">
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        );
        expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
        expect(container.firstChild).toHaveAttribute('data-x', '1');
        expect(container.firstChild).not.toHaveAttribute('aria-label');
        unmount();
        render(
            <>
                <h2 id="h">Heading</h2>
                <Tabs aria-labelledby="h" more={1}>
                    <TabPane itemKey="a" tab="A" />
                    <TabPane itemKey="b" tab="B" />
                </Tabs>
            </>
        );
        expect(screen.getByRole('tablist', { name: 'Heading' })).toBeInTheDocument();
    });

    it('keepDOM={false} 且只有一个子项时，未选中的面板不挂载', () => {
        render(
            <Tabs activeKey={null} keepDOM={false}>
                <TabPane itemKey="a" tab="A">
                    content-a
                </TabPane>
            </Tabs>
        );
        expect(screen.queryByText('content-a')).toBeNull();
        expect(tab('A')).not.toHaveAttribute('aria-controls');
    });

    it('more 菜单渲染节点形式的页签名称', async () => {
        const panes = [threePanes[0], { ...threePanes[1], tab: <b>rich-b</b> }];
        render(getTabs({ more: { count: 1, dropdownProps: { trigger: 'click' } } }, panes));
        await userEvent.click(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items[0]).toHaveTextContent('rich-b');
    });

    const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');

    it('more：选中页签收进菜单时，tablist 内第一个可用页签是唯一的 Tab 停靠点', () => {
        const { unmount } = render(getTabs({ more: 2, defaultActiveKey: 'c' }, threePanes));
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
        unmount();

        render(getTabs({ more: 1, defaultActiveKey: 'c' }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]));
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
    });

    it('more：选中页签在可见范围内时仍由它停靠', () => {
        render(getTabs({ more: 1, defaultActiveKey: 'b' }, threePanes));
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
    });

    it('more：count 为 0 的对象与 more={0} 一样不渲染「更多」触发器', () => {
        render(getTabs({ more: { count: 0 } }, threePanes));
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        expect(screen.queryByRole('button', { name: zh_CN.Tabs.more })).toBeNull();
    });

    it('collapsible：dropdownProps 的 className 追加到内置弹层类名之后', async () => {
        Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
        const io = stubIntersectionObserver();
        const panes = ['k0', 'k1', 'k2', 'k3'].map((key) => ({ itemKey: key, tab: `tab-${key}` }));
        const { container } = render(getTabs({ collapsible: true, dropdownProps: { end: { trigger: 'click', className: 'x' } } }, panes));
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-arrow-end button`));
        const popup = (await screen.findAllByRole('menuitemcheckbox'))[0].closest(`.${BASE_CLASS_PREFIX}-tabs-bar-dropdown`);
        expect(popup).toHaveClass('x');
    });

    it('键盘：焦点停在禁用页签上时，方向键移到相邻的可用页签', async () => {
        const panes = [...threePanes, { itemKey: 'd', tab: 'D' }, { itemKey: 'e', tab: 'E' }].map((pane) => (pane.itemKey === 'c' ? { ...pane, disabled: true } : pane));
        render(getTabs({}, panes));
        act(() => tab('C').focus());
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('D')).toHaveFocus();
        act(() => tab('C').focus());
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
    });

    it('renderTabBar 中自绘的 TabItem 使用 Tabs 的键盘处理', async () => {
        render(
            <Tabs
                renderTabBar={({ list, activeKey, onTabClick }) => (
                    <div role="tablist">
                        {list.map((pane) => (
                            <Tabs.TabItem key={pane.itemKey} itemKey={pane.itemKey} selected={pane.itemKey === activeKey} tab={pane.tab} onClick={onTabClick} />
                        ))}
                    </div>
                )}
            >
                <TabPane itemKey="a" tab="A" />
                <TabPane itemKey="b" tab="B" />
            </Tabs>
        );
        act(() => tab('A').focus());
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('B')).toHaveFocus();
    });
});

describe('Tabs 键盘与命名', () => {
    const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');

    it('activeKey 为 null 或不命中任何页签时，第一个启用的页签是唯一的 Tab 停靠点', () => {
        const panes = [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]];
        const { unmount } = render(getTabs({ activeKey: null }, panes));
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
        unmount();

        const second = render(getTabs({ defaultActiveKey: 'missing' }, threePanes));
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
        second.unmount();

        render(
            <Tabs
                activeKey={null}
                renderTabBar={({ list }) => (
                    <div role="tablist">
                        {list.map((pane) => (
                            <Tabs.TabItem key={pane.itemKey} itemKey={pane.itemKey} tab={pane.tab} />
                        ))}
                    </div>
                )}
            >
                <TabPane itemKey="a" tab="A" />
                <TabPane itemKey="b" tab="B" />
            </Tabs>
        );
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
    });

    it('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动焦点也不选中', () => {
        const onChange = vi.fn<NonNullable<TabsProps['onChange']>>();
        render(getTabs({ onChange }, threePanes));
        act(() => tab('B').focus());
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            for (const key of ['ArrowRight', 'Home', 'Enter']) {
                expect(fireEvent.keyDown(tab('B'), { key, [modifier]: true })).toBe(true);
                expect(tab('B')).toHaveFocus();
            }
        }
        expect(onChange).not.toHaveBeenCalled();
    });

    it('more：选中的页签收进菜单时，面板仍以该页签的名称命名', () => {
        const { unmount } = render(getTabs({ more: 2, defaultActiveKey: 'c' }, threePanes));
        expect(screen.getByRole('tabpanel', { name: 'C' })).toBeInTheDocument();
        unmount();

        render(
            <Tabs defaultActiveKey="b" more={1} tabList={threePanes.slice(0, 2)}>
                content
            </Tabs>
        );
        expect(screen.getByRole('tabpanel', { name: 'B' })).toHaveTextContent('content');
    });
});
