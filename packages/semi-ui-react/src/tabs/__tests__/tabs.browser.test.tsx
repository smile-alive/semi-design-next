import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { ConfigProvider, TabPane, Tabs } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, isChromium, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/react';
import type { TabsProps } from '../interface';

const arrowButton = (container, pos) => container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-arrow-${pos} .${BASE_CLASS_PREFIX}-button`);
const scrollWrapper = (container) => container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);

const isInside = (inner, outer) => {
    const a = inner.getBoundingClientRect();
    const b = outer.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1;
};

const renderCollapsibleTabs = (keys, props = {}) => (
    <Tabs type="card" style={{ width: 300 }} collapsible {...props}>
        {keys.map((i) => (
            <TabPane key={i} itemKey={`${i}`} tab={`tab-${i}`}>
                Content of card tab {i}
            </TabPane>
        ))}
    </Tabs>
);

const docTabs = [
    ['文档', '1'],
    ['快速起步', '2'],
    ['帮助', '3'],
    ['关于', '4'],
    ['资源工具', '5'],
];

const renderPanes = ({ disabledKeys = [], ...props }: TabsProps & { disabledKeys?: string[] } = {}) => (
    <Tabs style={{ width: 600, margin: 20 }} {...props}>
        {docTabs.map(([tab, itemKey]) => (
            <TabPane key={itemKey} disabled={disabledKeys.includes(itemKey)} itemKey={itemKey} tab={tab}>
                <span>{tab}</span>
            </TabPane>
        ))}
    </Tabs>
);

const activePane = (container) => container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-pane-active`);
const tabContent = (container) => container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-content`);
const tabByDataKey = (dataKey) => document.querySelector(`[data-tabkey="${dataKey}"]`);

const cardTabs = (count, props = {}) => (
    <Tabs type="card" style={{ width: '60%', margin: 20 }} collapsible {...props}>
        {[...Array(count).keys()].map((i) => (
            <TabPane key={i} itemKey={`Tab-${i}`} tab={`Tab-${i}`}>
                Content of card tab {i}
            </TabPane>
        ))}
    </Tabs>
);

function ActiveKeyDemo() {
    const [key, setKey] = useState('1');
    return renderPanes({ type: 'line', activeKey: key, onChange: setKey });
}

function TabListChangeDemo() {
    const [itemKey, setItemKey] = useState('1');
    const [tabList, setTabList] = useState(docTabs.map(([tab, key]) => ({ tab, itemKey: key })));
    const contentList = docTabs.map(([tab]) => <div key={tab}>{tab}</div>);
    return (
        <Tabs
            type="line"
            style={{ width: 600, margin: 20 }}
            tabList={tabList}
            onTabClick={(key) => {
                setItemKey(key);
                setTabList([{ tab: '文档', itemKey: '1' }]);
            }}
        >
            {contentList[itemKey]}
            <span>test</span>
            <span>test2</span>
        </Tabs>
    );
}

function TabClosableDemo() {
    const [tabList, setTabList] = useState([
        { tab: '文档', itemKey: '1', closable: true },
        { tab: '快速起步', itemKey: '2', closable: true },
        { tab: '帮助', itemKey: '3' },
    ]);
    const close = (key) => setTabList(tabList.filter((t) => t.itemKey !== key));
    return (['card', 'line', 'button', 'slash'] as const).map((type) => (
        <Tabs key={type} type={type} defaultActiveKey="1" onTabClose={close}>
            {tabList.map((t) => (
                <TabPane key={t.itemKey} closable={t.closable} itemKey={t.itemKey} tab={t.tab}>
                    {t.tab}
                </TabPane>
            ))}
        </Tabs>
    ));
}

function CollapseScrollIntoViewDemo() {
    const [activeKey, setActiveKey] = useState('Tab-9');
    return (
        <Tabs type="card" style={{ width: 250, margin: 20 }} activeKey={activeKey} collapsible onChange={setActiveKey}>
            {[...Array(10).keys()].map((i) => (
                <TabPane key={i} itemKey={`Tab-${i}`} tab={`Tab-${i}`}>
                    content of tab {i}
                </TabPane>
            ))}
        </Tabs>
    );
}

const expectArrows = async (container, { start, end }) => {
    await waitFor(() => {
        expect(arrowButton(container, 'start')).toHaveProperty('disabled', !start);
        expect(arrowButton(container, 'end')).toHaveProperty('disabled', !end);
    });
};

describe('Tabs（浏览器）', () => {
    it('Fix-1456：选择标签、切换 key 并纵向滚动后，折叠箭头保持同步', async () => {
        const { container, rerender } = render(
            <div id="wrapper" style={{ height: 300, overflowY: 'scroll' }}>
                <div style={{ height: 500, paddingTop: 20 }}>{renderCollapsibleTabs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])}</div>
            </div>
        );
        await expectArrows(container, { start: false, end: true });

        await userEvent.click(screen.getByRole('tab', { name: 'tab-2' }));
        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        const menuTexts = (await screen.findAllByRole('menuitemcheckbox')).map((item) => item.textContent);
        expect(menuTexts).toContain('tab-9');
        expect(menuTexts).not.toContain('tab-0');
        await userEvent.unhover(arrowButton(container, 'end'));

        rerender(
            <div id="wrapper" style={{ height: 300, overflowY: 'scroll' }}>
                <div style={{ height: 500, paddingTop: 20 }}>{renderCollapsibleTabs([8, 9, 10, 11, 12, 13, 14, 15])}</div>
            </div>
        );
        await waitFor(() => expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toContain('tab-15'));
        await expectArrows(container, { start: false, end: true });

        container.querySelector('#wrapper').scrollTop = 40;
        await sleep(300);
        await expectArrows(container, { start: false, end: true });
    });

    it('Fix 2239：受控 activeKey 变化时，将溢出的标签滚动到可见区域', async () => {
        const keys = [...Array(10).keys()];
        const renderControlled = (activeKey) => (
            <Tabs type="card" style={{ width: 500 }} activeKey={activeKey} collapsible>
                {keys.map((i) => (
                    <TabPane key={i} itemKey={`tab-${i}`} tab={`Tab-${i}`}>
                        content of tab {i}
                    </TabPane>
                ))}
            </Tabs>
        );
        const { container, rerender } = render(renderControlled('tab-0'));
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await expectArrows(container, { start: false, end: true });
        expect(isInside(tab7, scrollWrapper(container))).toBe(false);

        rerender(renderControlled('tab-7'));
        await waitFor(() => expect(isInside(tab7, scrollWrapper(container))).toBe(true));

        rerender(renderControlled('tab-0'));
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-0' }), scrollWrapper(container))).toBe(true));
    });

    it('标签栏在视口外时切换 activeKey，只滚动标签栏，不滚动页面', async () => {
        const keys = [...Array(10).keys()];
        const renderControlled = (activeKey) => (
            <>
                <div style={{ height: 3000 }} />
                <Tabs type="card" style={{ width: 500 }} activeKey={activeKey} collapsible>
                    {keys.map((i) => (
                        <TabPane key={i} itemKey={`tab-${i}`} tab={`Tab-${i}`}>
                            content of tab {i}
                        </TabPane>
                    ))}
                </Tabs>
            </>
        );
        window.scrollTo(0, 0);
        const { container, rerender } = render(renderControlled('tab-0'));
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await sleep(300);

        rerender(renderControlled('tab-7'));
        await waitFor(() => expect(isInside(tab7, scrollWrapper(container))).toBe(true));
        expect(window.scrollY).toBe(0);
    });

    it('折叠模式下 itemKey 含双引号与空格时，切换 activeKey 能滚动到该标签且不抛错', async () => {
        const keys = ['plain 0', 'q"1', ...Array.from({ length: 8 }, (_, i) => `tab "${i + 2}" x`)];
        const renderControlled = (activeKey: string) => renderCollapsibleTabs(keys, { activeKey });
        const { container, rerender } = render(renderControlled(keys[0]));
        const last = screen.getByRole('tab', { name: `tab-${keys.at(-1)}` });
        await expectArrows(container, { start: false, end: true });
        expect(isInside(last, scrollWrapper(container))).toBe(false);

        rerender(renderControlled(keys.at(-1)));
        await waitFor(() => expect(isInside(last, scrollWrapper(container))).toBe(true));
    });

    it('修复 #2415：快速点击末尾箭头时保留所有标签，到末尾后箭头禁用', async () => {
        const { container } = render(
            <Tabs type="card" style={{ width: 250 }} collapsible>
                {[10, 2324325324324, 1111].map((i) => (
                    <TabPane key={i} itemKey={`Tab-${i}`} tab={`Tab-${i}`}>
                        Content of card tab {i}
                    </TabPane>
                ))}
            </Tabs>
        );
        await expectArrows(container, { start: false, end: true });

        // Clicks during the smooth scroll land while no tab is fully visible, the state the fix guards. DOM clicks,
        // because the arrow button is re-rendered and may turn disabled between two real pointer clicks.
        const scrollLeft = () => scrollWrapper(container).scrollLeft;
        for (let i = 0; i < 5 && !arrowButton(container, 'end').disabled; i++) {
            const before = scrollLeft();
            arrowButton(container, 'end').click();
            await expect.poll(() => scrollLeft() !== before || arrowButton(container, 'end').disabled).toBe(true);
        }
        await expect
            .poll(
                () => {
                    arrowButton(container, 'end').click();
                    return arrowButton(container, 'end').disabled;
                },
                { interval: 500, timeout: 3000 }
            )
            .toBe(true);

        await expectArrows(container, { start: true, end: false });
        expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Tab-10', 'Tab-2324325324324', 'Tab-1111']);
    });

    it('activeKey', async () => {
        const { container } = render(<ActiveKeyDemo />);
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        await waitFor(() => expect(activePane(container)).toHaveTextContent('帮助'));
        await userEvent.click(screen.getByRole('tab', { name: '关于' }));
        await waitFor(() => expect(activePane(container)).toHaveTextContent('关于'));
    });

    it('标签列表变化', async () => {
        const { container } = render(<TabListChangeDemo />);
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tabs-bar`)).toHaveLength(1);
    });

    it('当前面板渲染', async () => {
        const { container } = render(renderPanes({ keepDOM: false }));
        expect(tabContent(container)).toHaveTextContent('文档');
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        await waitFor(() => expect(tabContent(container)).toHaveTextContent('帮助'));
        await userEvent.click(screen.getByRole('tab', { name: '关于' }));
        await waitFor(() => expect(tabContent(container)).toHaveTextContent('关于'));
    });

    it('折叠', async () => {
        // The width the 60% wide tabs had in the original 800px page with its 16px padding: Tab-6 is collapsed
        const { container } = render(<div style={{ width: 768 }}>{cardTabs(30)}</div>);
        expect(tabContent(container)).toMatchTextContent('Content of card tab 0');

        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        const menuItems = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(menuItems.find((item) => item.textContent === 'Tab-6'));
        await waitFor(() => expect(tabContent(container)).toMatchTextContent('Content of card tab 6'));

        await waitFor(() => expect(arrowButton(container, 'start')).toBeEnabled());
        await userEvent.click(arrowButton(container, 'start'), { force: true });
        await userEvent.click(screen.getByRole('tab', { name: 'Tab-10' }), { force: true });
        await waitFor(() => expect(tabContent(container)).toMatchTextContent('Content of card tab 10'));
    });

    it('水平 Tabs 的键盘测试', async () => {
        render(renderPanes({ defaultActiveKey: '1', disabledKeys: ['3', '4'] }));
        await userEvent.click(tabByDataKey('semiTab2'));
        expect(tabByDataKey('semiTab2')).toHaveFocus();

        await userEvent.keyboard('{ArrowRight}');
        expect(tabByDataKey('semiTab5')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(tabByDataKey('semiTab1')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tabByDataKey('semiTab5')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tabByDataKey('semiTab1')).toHaveFocus();
        await userEvent.keyboard('{End}');
        expect(tabByDataKey('semiTab5')).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{Tab}');
        await waitFor(() => expect(document.getElementById(tabByDataKey('semiTab5').getAttribute('aria-controls'))).toHaveFocus());
    });

    it('垂直 Tabs 的键盘测试', async () => {
        render(renderPanes({ tabPosition: 'left' }));
        await userEvent.click(tabByDataKey('semiTab1'));
        expect(tabByDataKey('semiTab1')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tabByDataKey('semiTab2')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(tabByDataKey('semiTab1')).toHaveFocus();
    });

    it('可关闭 Tabs 的键盘测试', async () => {
        render(<TabClosableDemo />);
        const tab = document.querySelector('[data-tabkey=semiTab1]');
        await userEvent.click(tab);
        expect(tab).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(document.querySelector('[data-tabkey=semiTab1]')).toBeNull());
    });

    // Reads Chrome's accessibility tree over CDP
    it.skipIf(!isChromium)('可关闭页签的关闭按钮出现在 Chrome 的无障碍树中', async () => {
        render(<TabClosableDemo />);
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frame = frameTree?.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
        if (!frame) throw new Error('vitest-iframe frame not found');
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
        const exposed = nodes.filter((node) => !node.ignored);
        const closeButtons = exposed.filter((node) => node.role?.value === 'button' && node.name?.value === zh_CN.Tabs.close);
        expect(closeButtons).toHaveLength(8);
    });

    it('Tabs 挂载并折叠后，activeTab 位于视口内', async () => {
        const { container } = render(<CollapseScrollIntoViewDemo />);
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-9' }), scrollWrapper(container))).toBe(true));
    });

    it('showRestInDropdown', async () => {
        const { container } = render(cardTabs(30, { showRestInDropdown: false }));
        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        // Asserting an absence: wait past the dropdown's hover delay before checking it never opened
        await sleep(500);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-content .${BASE_CLASS_PREFIX}-dropdown-item`)).toBeNull();
    });

    it.each(['line', 'card', 'button', 'slash'] as const)('%s 类型的标签显示主题焦点环', async (type) => {
        const { container } = render(
            <Tabs type={type}>
                <TabPane itemKey="1" tab="one">
                    one
                </TabPane>
                <TabPane itemKey="2" tab="two">
                    two
                </TabPane>
            </Tabs>
        );
        const tab = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-tab`);
        await tabTo(tab);
        expectThemeFocusRing(tab);
    });

    it.each(['ltr', 'rtl'] as const)('tabBarExtraContent 位于 %s 标签栏的行内末端', (direction) => {
        const { container } = render(
            <ConfigProvider direction={direction}>
                <div style={{ width: 600 }}>
                    <Tabs tabBarExtraContent={<button>Extra</button>}>
                        <TabPane itemKey="1" tab="one">
                            one
                        </TabPane>
                        <TabPane itemKey="2" tab="two">
                            two
                        </TabPane>
                    </Tabs>
                </div>
            </ConfigProvider>
        );
        const bar = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar`).getBoundingClientRect();
        const extra = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-extra`).getBoundingClientRect();
        const gapToInlineEnd = direction === 'rtl' ? extra.left - bar.left : bar.right - extra.right;
        expect(gapToInlineEnd).toBeCloseTo(0, 0);
    });

    it('collapsible="auto" 在折叠布局能放下全部标签的宽度上也不会来回切换', async () => {
        const keys = ['a', 'b', 'c', 'd', 'e'];
        const tabs = (width: number, collapsible?: 'auto') => (
            <Tabs type="card" style={{ width }} collapsible={collapsible}>
                {keys.map((key) => (
                    <TabPane key={key} itemKey={key} tab={key === 'e' ? 'a very long tab title that is wide enough to stay mostly visible beside the arrows' : `tab-title-${key}`}>
                        {key}
                    </TabPane>
                ))}
            </Tabs>
        );
        const probe = render(tabs(2000));
        const nodes = [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tabs-tab`)];
        const total = nodes.at(-1).getBoundingClientRect().right - nodes[0].getBoundingClientRect().left;
        probe.unmount();
        for (const delta of [1, 17, 25, 49]) {
            const { container, unmount } = render(tabs(Math.floor(total - delta), 'auto'));
            const bar = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar`);
            let changes = 0;
            const observer = new MutationObserver(() => changes++);
            observer.observe(bar, { attributes: true, attributeFilter: ['class'] });
            await sleep(400);
            observer.disconnect();
            expect(changes, `delta=${delta}`).toBeLessThanOrEqual(1);
            unmount();
        }
    });

    it('collapsible="auto" 受控页签点击导致父组件重渲染后不会来回切换', async () => {
        const keys = ['a', 'b', 'c', 'd', 'e'];
        const title = (key: string) => (key === 'e' ? 'a very long tab title that is wide enough to stay mostly visible beside the arrows' : `tab-title-${key}`);
        const Controlled = ({ width, collapsible }: { width: number; collapsible?: 'auto' }) => {
            const [activeKey, setActiveKey] = useState('a');
            return (
                <Tabs type="card" style={{ width }} activeKey={activeKey} collapsible={collapsible} onChange={setActiveKey}>
                    {keys.map((key) => (
                        <TabPane key={key} itemKey={key} tab={title(key)}>
                            {key}
                        </TabPane>
                    ))}
                </Tabs>
            );
        };
        const probe = render(<Controlled width={2000} />);
        const nodes = [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tabs-tab`)];
        const total = nodes.at(-1).getBoundingClientRect().right - nodes[0].getBoundingClientRect().left;
        probe.unmount();
        for (const delta of [1, 17, 25, 49]) {
            const { container, unmount } = render(<Controlled collapsible="auto" width={Math.floor(total - delta)} />);
            await sleep(400);
            const bar = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar`);
            expect(bar.className, `delta=${delta}`).toContain(`${BASE_CLASS_PREFIX}-tabs-bar-collapse`);
            let changes = 0;
            const observer = new MutationObserver(() => changes++);
            observer.observe(bar, { attributes: true, attributeFilter: ['class'] });
            // the last tab is partly clipped: activating it scrolls it into view
            await userEvent.click(screen.getByRole('tab', { name: /^a very long tab title/ }));
            await sleep(400);
            // back at the start every tab is at least 75% visible again
            await userEvent.click(screen.getByRole('tab', { name: 'tab-title-a' }));
            await sleep(400);
            observer.disconnect();
            expect(changes, `delta=${delta}`).toBe(0);
            unmount();
        }
    });
});
