import { createSignal, For, splitProps } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, isChromium, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/solid';
import Tabs, { type TabsProps } from '..';
import ConfigProvider from '../../config-provider';

const { TabPane } = Tabs;
const prefix = `${BASE_CLASS_PREFIX}-tabs`;

const docTabs = [
    ['文档', '1'],
    ['快速起步', '2'],
    ['帮助', '3'],
    ['关于', '4'],
    ['资源工具', '5'],
] as const;

function DocTabs(props: TabsProps & { disabledKeys?: string[] }) {
    const [local, rest] = splitProps(props, ['disabledKeys']);
    return (
        <Tabs style={{ width: '600px', margin: '20px' }} {...rest}>
            <For each={docTabs}>
                {([title, itemKey]) => (
                    <TabPane disabled={local.disabledKeys?.includes(itemKey)} itemKey={itemKey} tab={title}>
                        <span>{title}</span>
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}

const activePane = (container: HTMLElement) => container.querySelector(`.${prefix}-pane-active`) as HTMLElement;
const tabContent = (container: HTMLElement) => container.querySelector(`.${prefix}-content`) as HTMLElement;
const tabByDataKey = (dataKey: string) => document.querySelector(`[data-tabkey="${dataKey}"]`) as HTMLElement;

function ClosableTabs() {
    const [list, setList] = createSignal([
        { tab: '文档', itemKey: '1', closable: true },
        { tab: '快速起步', itemKey: '2', closable: true },
        { tab: '帮助', itemKey: '3', closable: false },
    ]);
    const close = (key: string) => setList(list().filter((item) => item.itemKey !== key));
    return (
        <For each={['card', 'line', 'button', 'slash'] as const}>
            {(type) => (
                <Tabs type={type} defaultActiveKey="1" onTabClose={close}>
                    <For each={list()}>
                        {(item) => (
                            <TabPane closable={item.closable} itemKey={item.itemKey} tab={item.tab}>
                                {item.tab}
                            </TabPane>
                        )}
                    </For>
                </Tabs>
            )}
        </For>
    );
}

describe('Tabs（浏览器）', () => {
    it('首帧即有全部标签，For 增删后标签随之更新', () => {
        const [keys, setKeys] = createSignal(['a', 'b']);
        render(() => (
            <Tabs>
                <For each={keys()}>{(key) => <TabPane itemKey={key} tab={key.toUpperCase()} />}</For>
            </Tabs>
        ));
        expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual(['A', 'B']);
        setKeys(['a', 'c', 'b']);
        expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual(['A', 'C', 'B']);
        setKeys(['c']);
        expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual(['C']);
        expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
    });

    it('受控 activeKey 经 onChange 更新', async () => {
        const [key, setKey] = createSignal('1');
        const { container } = render(() => <DocTabs type="line" activeKey={key()} onChange={setKey} />);
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        expect(activePane(container)).toHaveTextContent('帮助');
        await userEvent.click(screen.getByRole('tab', { name: '关于' }));
        expect(activePane(container)).toHaveTextContent('关于');
    });

    it('标签列表变化', async () => {
        const [list, setList] = createSignal(docTabs.map(([tab, itemKey]) => ({ tab, itemKey })));
        const { container } = render(() => (
            <Tabs type="line" style={{ width: '600px', margin: '20px' }} tabList={list()} onTabClick={() => setList([{ tab: '文档', itemKey: '1' }])}>
                <span>test</span>
            </Tabs>
        ));
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        expect(screen.getAllByRole('tab')).toHaveLength(1);
        expect(container.querySelectorAll(`.${prefix}-bar`)).toHaveLength(1);
    });

    it('keepDOM={false} 时只渲染当前面板', async () => {
        const { container } = render(() => <DocTabs keepDOM={false} />);
        expect(tabContent(container)).toHaveTextContent('文档');
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        expect(tabContent(container)).toHaveTextContent('帮助');
        await userEvent.click(screen.getByRole('tab', { name: '关于' }));
        expect(tabContent(container)).toHaveTextContent('关于');
    });

    it('水平 Tabs 的键盘测试', async () => {
        render(() => <DocTabs defaultActiveKey="1" disabledKeys={['3', '4']} />);
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
        expect(document.getElementById(tabByDataKey('semiTab5').getAttribute('aria-controls') ?? '')).toHaveFocus();
    });

    it('垂直 Tabs 的键盘测试', async () => {
        render(() => <DocTabs tabPosition="left" />);
        await userEvent.click(tabByDataKey('semiTab1'));
        expect(tabByDataKey('semiTab1')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tabByDataKey('semiTab2')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(tabByDataKey('semiTab1')).toHaveFocus();
    });

    it('可关闭 Tabs 的键盘测试：Backspace 关闭后焦点移到相邻标签', async () => {
        render(() => <ClosableTabs />);
        const first = tabByDataKey('semiTab1');
        await userEvent.click(first);
        expect(first).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        expect(document.querySelector('[data-tabkey=semiTab1]')).toBeNull();
        expect(document.activeElement).toHaveAttribute('data-tabkey', 'semiTab2');
    });

    // Reads Chrome's accessibility tree over CDP
    it.skipIf(!isChromium)('可关闭页签的关闭按钮出现在 Chrome 的无障碍树中', async () => {
        render(() => <ClosableTabs />);
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frame = frameTree?.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
        if (!frame) throw new Error('vitest-iframe frame not found');
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
        const exposed = nodes.filter((node) => !node.ignored);
        const closeButtons = exposed.filter((node) => node.role?.value === 'button' && node.name?.value === zh_CN.Tabs.close);
        expect(closeButtons).toHaveLength(8);
    });

    it.each(['line', 'card', 'button', 'slash'] as const)('%s 类型的标签显示主题焦点环', async (type) => {
        const { container } = render(() => (
            <Tabs type={type}>
                <TabPane itemKey="1" tab="one">
                    one
                </TabPane>
                <TabPane itemKey="2" tab="two">
                    two
                </TabPane>
            </Tabs>
        ));
        const tab = container.querySelector(`.${prefix}-tab`) as HTMLElement;
        await tabTo(tab);
        expectThemeFocusRing(tab);
    });

    it.each(['ltr', 'rtl'] as const)('tabBarExtraContent 位于 %s 标签栏的行内末端', (direction) => {
        const { container } = render(() => (
            <ConfigProvider direction={direction}>
                <div style={{ width: '600px' }}>
                    <Tabs tabBarExtraContent={<button type="button">Extra</button>}>
                        <TabPane itemKey="1" tab="one">
                            one
                        </TabPane>
                        <TabPane itemKey="2" tab="two">
                            two
                        </TabPane>
                    </Tabs>
                </div>
            </ConfigProvider>
        ));
        const bar = (container.querySelector(`.${prefix}-bar`) as HTMLElement).getBoundingClientRect();
        const extra = (container.querySelector(`.${prefix}-bar-extra`) as HTMLElement).getBoundingClientRect();
        const gapToInlineEnd = direction === 'rtl' ? extra.left - bar.left : bar.right - extra.right;
        expect(gapToInlineEnd).toBeCloseTo(0, 0);
    });

    it('面板滑入动画在真实 animationend 后去掉方向 class', async () => {
        const { container } = render(() => <DocTabs />);
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        const overlay = activePane(container).querySelector(`.${prefix}-pane-motion-overlay`) as HTMLElement;
        expect(overlay).toHaveClass(`${prefix}-pane-animate-leftShow`);
        await expect.poll(() => overlay.className).not.toContain('animate');
    });
});

const arrowButton = (container: HTMLElement, pos: string) => container.querySelector(`.${prefix}-bar-arrow-${pos} .${BASE_CLASS_PREFIX}-button`) as HTMLButtonElement;
const scrollWrapper = (container: HTMLElement) => container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`) as HTMLElement;

function isInside(inner: Element, outer: Element) {
    const a = inner.getBoundingClientRect();
    const b = outer.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1;
}

const expectArrows = (container: HTMLElement, { start, end }: { start: boolean; end: boolean }) =>
    waitFor(() => {
        expect(arrowButton(container, 'start')).toHaveProperty('disabled', !start);
        expect(arrowButton(container, 'end')).toHaveProperty('disabled', !end);
    });

function CollapsibleTabs(props: TabsProps & { keys: readonly (string | number)[] }) {
    const [local, rest] = splitProps(props, ['keys']);
    return (
        <Tabs type="card" style={{ width: '300px' }} collapsible {...rest}>
            <For each={local.keys}>
                {(i) => (
                    <TabPane itemKey={`${i}`} tab={`tab-${i}`}>
                        Content of card tab {i}
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}

function CardTabs(props: TabsProps & { count: number }) {
    const [local, rest] = splitProps(props, ['count']);
    return (
        <Tabs type="card" style={{ width: '60%', margin: '20px' }} collapsible {...rest}>
            <For each={[...Array(local.count).keys()]}>
                {(i) => (
                    <TabPane itemKey={`Tab-${i}`} tab={`Tab-${i}`}>
                        Content of card tab {i}
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}

const longTitle = 'a very long tab title that is wide enough to stay mostly visible beside the arrows';
const autoKeys = ['a', 'b', 'c', 'd', 'e'];

function AutoTabs(props: { width: number; collapsible?: 'auto'; controlled?: boolean }) {
    const [activeKey, setActiveKey] = createSignal('a');
    return (
        <Tabs type="card" style={{ width: `${props.width}px` }} collapsible={props.collapsible} activeKey={props.controlled ? activeKey() : undefined} onChange={setActiveKey}>
            <For each={autoKeys}>
                {(key) => (
                    <TabPane itemKey={key} tab={key === 'e' ? longTitle : `tab-title-${key}`}>
                        {key}
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}

// the width the five tabs need side by side, measured without collapsing
function measureAutoTabs() {
    const probe = render(() => <AutoTabs width={2000} />);
    const nodes = [...document.querySelectorAll<HTMLElement>(`.${prefix}-tab`)];
    const total = (nodes.at(-1) as HTMLElement).getBoundingClientRect().right - nodes[0].getBoundingClientRect().left;
    probe.unmount();
    return total;
}

describe('Tabs 折叠（浏览器）', () => {
    it('Fix-1456：选择标签、切换 key 并纵向滚动后，折叠箭头保持同步', async () => {
        const [keys, setKeys] = createSignal<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const { container } = render(() => (
            <div id="wrapper" style={{ height: '300px', 'overflow-y': 'scroll' }}>
                <div style={{ height: '500px', 'padding-top': '20px' }}>
                    <CollapsibleTabs keys={keys()} />
                </div>
            </div>
        ));
        await expectArrows(container, { start: false, end: true });

        await userEvent.click(screen.getByRole('tab', { name: 'tab-2' }));
        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        const menuTexts = (await screen.findAllByRole('menuitemcheckbox')).map((item) => item.textContent);
        expect(menuTexts).toContain('tab-9');
        expect(menuTexts).not.toContain('tab-0');
        await userEvent.unhover(arrowButton(container, 'end'));

        setKeys([8, 9, 10, 11, 12, 13, 14, 15]);
        await waitFor(() => expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toContain('tab-15'));
        await expectArrows(container, { start: false, end: true });

        (container.querySelector('#wrapper') as HTMLElement).scrollTop = 40;
        await sleep(300);
        await expectArrows(container, { start: false, end: true });
    });

    it('Fix 2239：受控 activeKey 变化时，将溢出的标签滚动到可见区域', async () => {
        const [activeKey, setActiveKey] = createSignal('tab-0');
        const { container } = render(() => (
            <Tabs type="card" style={{ width: '500px' }} activeKey={activeKey()} collapsible>
                <For each={[...Array(10).keys()]}>
                    {(i) => (
                        <TabPane itemKey={`tab-${i}`} tab={`Tab-${i}`}>
                            content of tab {i}
                        </TabPane>
                    )}
                </For>
            </Tabs>
        ));
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await expectArrows(container, { start: false, end: true });
        expect(isInside(tab7, scrollWrapper(container))).toBe(false);

        setActiveKey('tab-7');
        await waitFor(() => expect(isInside(tab7, scrollWrapper(container))).toBe(true));

        setActiveKey('tab-0');
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-0' }), scrollWrapper(container))).toBe(true));
    });

    it('标签栏在视口外时切换 activeKey，只滚动标签栏，不滚动页面', async () => {
        const [activeKey, setActiveKey] = createSignal('tab-0');
        window.scrollTo(0, 0);
        const { container } = render(() => (
            <>
                <div style={{ height: '3000px' }} />
                <Tabs type="card" style={{ width: '500px' }} activeKey={activeKey()} collapsible>
                    <For each={[...Array(10).keys()]}>
                        {(i) => (
                            <TabPane itemKey={`tab-${i}`} tab={`Tab-${i}`}>
                                content of tab {i}
                            </TabPane>
                        )}
                    </For>
                </Tabs>
            </>
        ));
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await sleep(300);

        setActiveKey('tab-7');
        await waitFor(() => expect(isInside(tab7, scrollWrapper(container))).toBe(true));
        expect(window.scrollY).toBe(0);
    });

    it('折叠模式下 itemKey 含双引号与空格时，切换 activeKey 能滚动到该标签且不抛错', async () => {
        const keys = ['plain 0', 'q"1', ...Array.from({ length: 8 }, (_, i) => `tab "${i + 2}" x`)];
        const [activeKey, setActiveKey] = createSignal(keys[0]);
        const { container } = render(() => <CollapsibleTabs keys={keys} activeKey={activeKey()} />);
        const last = screen.getByRole('tab', { name: `tab-${keys.at(-1)}` });
        await expectArrows(container, { start: false, end: true });
        expect(isInside(last, scrollWrapper(container))).toBe(false);

        setActiveKey(keys.at(-1) as string);
        await waitFor(() => expect(isInside(last, scrollWrapper(container))).toBe(true));
    });

    it('修复 #2415：快速点击末尾箭头时保留所有标签，到末尾后箭头禁用', async () => {
        const { container } = render(() => <CollapsibleTabs keys={['Tab-10', 'Tab-2324325324324', 'Tab-1111']} style={{ width: '250px' }} />);
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
        expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['tab-Tab-10', 'tab-Tab-2324325324324', 'tab-Tab-1111']);
    });

    it('折叠', async () => {
        // The width the 60% wide tabs had in the original 800px page with its 16px padding: Tab-6 is collapsed
        const { container } = render(() => (
            <div style={{ width: '768px' }}>
                <CardTabs count={30} />
            </div>
        ));
        expect(activePane(container)).toHaveTextContent('Content of card tab 0');

        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        const menuItems = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(menuItems.find((item) => item.textContent === 'Tab-6') as HTMLElement);
        await waitFor(() => expect(activePane(container)).toHaveTextContent('Content of card tab 6'));

        await waitFor(() => expect(arrowButton(container, 'start')).toBeEnabled());
        await userEvent.click(arrowButton(container, 'start'), { force: true });
        await userEvent.click(screen.getByRole('tab', { name: 'Tab-10' }), { force: true });
        await waitFor(() => expect(activePane(container)).toHaveTextContent('Content of card tab 10'));
    });

    it('Tabs 挂载并折叠后，activeTab 位于视口内', async () => {
        const [activeKey, setActiveKey] = createSignal('Tab-9');
        const { container } = render(() => <CardTabs count={10} style={{ width: '250px', margin: '20px' }} activeKey={activeKey()} onChange={setActiveKey} />);
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-9' }), scrollWrapper(container))).toBe(true));
    });

    it('showRestInDropdown', async () => {
        const { container } = render(() => <CardTabs count={30} showRestInDropdown={false} />);
        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        // Asserting an absence: wait past the dropdown's hover delay before checking it never opened
        await sleep(500);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-content .${BASE_CLASS_PREFIX}-dropdown-item`)).toBeNull();
    });

    it('collapsible="auto" 在折叠布局能放下全部标签的宽度上也不会来回切换', async () => {
        const total = measureAutoTabs();
        for (const delta of [1, 17, 25, 49]) {
            const { container, unmount } = render(() => <AutoTabs width={Math.floor(total - delta)} collapsible="auto" />);
            const bar = container.querySelector(`.${prefix}-bar`) as HTMLElement;
            let changes = 0;
            const observer = new MutationObserver(() => changes++);
            observer.observe(bar, { attributes: true, attributeFilter: ['class'] });
            await sleep(400);
            observer.disconnect();
            expect(changes, `delta=${delta}`).toBeLessThanOrEqual(1);
            unmount();
        }
    });

    it('collapsible="auto" 受控页签点击后不会来回切换', async () => {
        const total = measureAutoTabs();
        for (const delta of [1, 17, 25, 49]) {
            const { container, unmount } = render(() => <AutoTabs width={Math.floor(total - delta)} collapsible="auto" controlled />);
            await sleep(400);
            const bar = container.querySelector(`.${prefix}-bar`) as HTMLElement;
            expect(bar.className, `delta=${delta}`).toContain(`${prefix}-bar-collapse`);
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
