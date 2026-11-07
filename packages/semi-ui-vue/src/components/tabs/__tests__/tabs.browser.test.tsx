/** @jsxImportSource vue */
import { defineComponent, nextTick, ref, shallowReactive, type VNode } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, isChromium, tabTo } from '@test/utils/browser';
import { render, sleep } from '@test/utils/vue';
import Tabs, { TabPane } from '..';
import ConfigProvider from '../../config-provider';

const arrowButton = (container: Element, pos: 'start' | 'end') => container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-arrow-${pos} .${BASE_CLASS_PREFIX}-button`) as HTMLButtonElement;
const scrollWrapper = (container: Element) => container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`) as HTMLElement;
const activePane = (container: Element) => container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-pane-active`);
const tabContent = (container: Element) => container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-content`);
const tabByDataKey = (dataKey: string) => document.querySelector(`[data-tabkey="${dataKey}"]`) as HTMLElement;

function isInside(inner: Element, outer: Element) {
    const a = inner.getBoundingClientRect();
    const b = outer.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1;
}

const pane = (itemKey: string, tab: string, content: () => unknown, extra: Record<string, unknown> = {}) => (
    <TabPane key={itemKey} itemKey={itemKey} {...extra}>
        {{ default: content, tab: () => tab }}
    </TabPane>
);

const collapsibleTabs = (keys: (string | number)[], props: Record<string, unknown> = {}) => (
    <Tabs type="card" style={{ width: '300px' }} collapsible {...props}>
        {() => keys.map((i) => pane(`${i}`, `tab-${i}`, () => `Content of card tab ${i}`))}
    </Tabs>
);

const docTabs = [
    ['文档', '1'],
    ['快速起步', '2'],
    ['帮助', '3'],
    ['关于', '4'],
    ['资源工具', '5'],
];

const panes = ({ disabledKeys = [], ...props }: Record<string, unknown> & { disabledKeys?: string[] } = {}) => (
    <Tabs style={{ width: '600px', margin: '20px' }} {...props}>
        {() => docTabs.map(([tab, itemKey]) => pane(itemKey, tab, () => <span>{tab}</span>, { disabled: disabledKeys.includes(itemKey) }))}
    </Tabs>
);

const cardTabs = (count: number, props: Record<string, unknown> = {}) => (
    <Tabs type="card" style={{ width: '60%', margin: '20px' }} collapsible {...props}>
        {() => [...Array(count).keys()].map((i) => pane(`Tab-${i}`, `Tab-${i}`, () => `Content of card tab ${i}`))}
    </Tabs>
);

function mountView<S extends object>(initial: S, view: (state: S) => VNode) {
    const state = shallowReactive(initial);
    const result = render(defineComponent(() => () => view(state)));
    return {
        ...result,
        update: async (next: Partial<S>) => {
            Object.assign(state, next);
            await nextTick();
        },
    };
}

const ActiveKeyDemo = defineComponent(() => {
    const key = ref('1');
    return () =>
        panes({
            type: 'line',
            activeKey: key.value,
            onChange: (next: string) => {
                key.value = next;
            },
        });
});

const TabListChangeDemo = defineComponent(() => {
    const itemKey = ref('1');
    const tabList = ref(docTabs.map(([tab, key]) => ({ tab, itemKey: key })));
    return () => (
        <Tabs
            type="line"
            style={{ width: '600px', margin: '20px' }}
            tabList={tabList.value}
            onTabClick={(key: string) => {
                itemKey.value = key;
                tabList.value = [{ tab: '文档', itemKey: '1' }];
            }}
        >
            {() => (
                <>
                    <div>{docTabs[Number(itemKey.value)]?.[0]}</div>
                    <span>test</span>
                    <span>test2</span>
                </>
            )}
        </Tabs>
    );
});

const TabClosableDemo = defineComponent(() => {
    const tabList = ref([
        { tab: '文档', itemKey: '1', closable: true },
        { tab: '快速起步', itemKey: '2', closable: true },
        { tab: '帮助', itemKey: '3', closable: false },
    ]);
    const close = (key: string) => {
        tabList.value = tabList.value.filter((t) => t.itemKey !== key);
    };
    return () =>
        (['card', 'line', 'button', 'slash'] as const).map((type) => (
            <Tabs key={type} type={type} defaultActiveKey="1" onTabClose={close}>
                {() => tabList.value.map((t) => pane(t.itemKey, t.tab, () => t.tab, { closable: t.closable }))}
            </Tabs>
        ));
});

const CollapseScrollIntoViewDemo = defineComponent(() => {
    const activeKey = ref('Tab-9');
    return () => (
        <Tabs
            type="card"
            style={{ width: '250px', margin: '20px' }}
            activeKey={activeKey.value}
            collapsible
            onChange={(key: string) => {
                activeKey.value = key;
            }}
        >
            {() => [...Array(10).keys()].map((i) => pane(`Tab-${i}`, `Tab-${i}`, () => `content of tab ${i}`))}
        </Tabs>
    );
});

async function expectArrows(container: Element, { start, end }: { start: boolean; end: boolean }) {
    await waitFor(() => {
        expect(arrowButton(container, 'start')).toHaveProperty('disabled', !start);
        expect(arrowButton(container, 'end')).toHaveProperty('disabled', !end);
    });
}

describe('Tabs（浏览器）', () => {
    it('Fix-1456：选择标签、切换 key 并纵向滚动后，折叠箭头保持同步', async () => {
        const { container, update } = mountView({ keys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }, ({ keys }) => (
            <div id="wrapper" style={{ height: '300px', overflowY: 'scroll' }}>
                <div style={{ height: '500px', paddingTop: '20px' }}>{collapsibleTabs(keys)}</div>
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

        await update({ keys: [8, 9, 10, 11, 12, 13, 14, 15] });
        await waitFor(() => expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toContain('tab-15'));
        await expectArrows(container, { start: false, end: true });

        (container.querySelector('#wrapper') as HTMLElement).scrollTop = 40;
        await sleep(300);
        await expectArrows(container, { start: false, end: true });
    });

    it('Fix 2239：受控 activeKey 变化时，将溢出的标签滚动到可见区域', async () => {
        const keys = [...Array(10).keys()];
        const { container, update } = mountView({ activeKey: 'tab-0' }, ({ activeKey }) => (
            <Tabs type="card" style={{ width: '500px' }} activeKey={activeKey} collapsible>
                {() => keys.map((i) => pane(`tab-${i}`, `Tab-${i}`, () => `content of tab ${i}`))}
            </Tabs>
        ));
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await expectArrows(container, { start: false, end: true });
        expect(isInside(tab7, scrollWrapper(container))).toBe(false);

        await update({ activeKey: 'tab-7' });
        await waitFor(() => expect(isInside(tab7, scrollWrapper(container))).toBe(true));

        await update({ activeKey: 'tab-0' });
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-0' }), scrollWrapper(container))).toBe(true));
    });

    it('标签栏在视口外时切换 activeKey，只滚动标签栏，不滚动页面', async () => {
        const keys = [...Array(10).keys()];
        window.scrollTo(0, 0);
        const { container, update } = mountView({ activeKey: 'tab-0' }, ({ activeKey }) => (
            <div>
                <div style={{ height: '3000px' }} />
                <Tabs type="card" style={{ width: '500px' }} activeKey={activeKey} collapsible>
                    {() => keys.map((i) => pane(`tab-${i}`, `Tab-${i}`, () => `content of tab ${i}`))}
                </Tabs>
            </div>
        ));
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await sleep(300);

        await update({ activeKey: 'tab-7' });
        await waitFor(() => expect(isInside(tab7, scrollWrapper(container))).toBe(true));
        expect(window.scrollY).toBe(0);
    });

    it('折叠模式下 itemKey 含双引号与空格时，切换 activeKey 能滚动到该标签且不抛错', async () => {
        const keys = ['plain 0', 'q"1', ...Array.from({ length: 8 }, (_, i) => `tab "${i + 2}" x`)];
        const { container, update } = mountView({ activeKey: keys[0] }, ({ activeKey }) => collapsibleTabs(keys, { activeKey }));
        const last = screen.getByRole('tab', { name: `tab-${keys.at(-1)}` });
        await expectArrows(container, { start: false, end: true });
        expect(isInside(last, scrollWrapper(container))).toBe(false);

        await update({ activeKey: keys.at(-1) as string });
        await waitFor(() => expect(isInside(last, scrollWrapper(container))).toBe(true));
    });

    it('修复 #2415：快速点击末尾箭头时保留所有标签，到末尾后箭头禁用', async () => {
        const { container } = render(() => (
            <Tabs type="card" style={{ width: '250px' }} collapsible>
                {() => [10, 2324325324324, 1111].map((i) => pane(`Tab-${i}`, `Tab-${i}`, () => `Content of card tab ${i}`))}
            </Tabs>
        ));
        await expectArrows(container, { start: false, end: true });

        // DOM clicks: the arrow button re-renders and may turn disabled between two real pointer clicks
        const scrollLeft = () => scrollWrapper(container).scrollLeft;
        for (let i = 0; i < 5 && !arrowButton(container, 'end').disabled; i++) {
            const before = scrollLeft();
            arrowButton(container, 'end').click();
            await vi.waitUntil(() => scrollLeft() !== before || arrowButton(container, 'end').disabled, { timeout: 1000 }).catch(() => undefined);
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
        const { container } = render(ActiveKeyDemo);
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        await waitFor(() => expect(activePane(container)).toHaveTextContent('帮助'));
        await userEvent.click(screen.getByRole('tab', { name: '关于' }));
        await waitFor(() => expect(activePane(container)).toHaveTextContent('关于'));
    });

    it('标签列表变化', async () => {
        const { container } = render(TabListChangeDemo);
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tabs-bar`)).toHaveLength(1);
    });

    it('当前面板渲染', async () => {
        const { container } = render(() => panes({ keepDOM: false }));
        expect(tabContent(container)).toHaveTextContent('文档');
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        await waitFor(() => expect(tabContent(container)).toHaveTextContent('帮助'));
        await userEvent.click(screen.getByRole('tab', { name: '关于' }));
        await waitFor(() => expect(tabContent(container)).toHaveTextContent('关于'));
    });

    it('折叠', async () => {
        const { container } = render(() => <div style={{ width: '768px' }}>{cardTabs(30)}</div>);
        expect(activePane(container)).toMatchTextContent('Content of card tab 0');

        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        const menuItems = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(menuItems.find((item) => item.textContent === 'Tab-6') as HTMLElement);
        await waitFor(() => expect(activePane(container)).toMatchTextContent('Content of card tab 6'));

        await waitFor(() => expect(arrowButton(container, 'start')).toBeEnabled());
        await userEvent.click(arrowButton(container, 'start'), { force: true });
        await userEvent.click(screen.getByRole('tab', { name: 'Tab-10' }), { force: true });
        await waitFor(() => expect(activePane(container)).toMatchTextContent('Content of card tab 10'));
    });

    it('水平 Tabs 的键盘测试', async () => {
        render(() => panes({ defaultActiveKey: '1', disabledKeys: ['3', '4'] }));
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
        await waitFor(() => expect(document.getElementById(tabByDataKey('semiTab5').getAttribute('aria-controls') as string)).toHaveFocus());
    });

    it('垂直 Tabs 的键盘测试', async () => {
        render(() => panes({ tabPosition: 'left' }));
        await userEvent.click(tabByDataKey('semiTab1'));
        expect(tabByDataKey('semiTab1')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tabByDataKey('semiTab2')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(tabByDataKey('semiTab1')).toHaveFocus();
    });

    it('可关闭 Tabs 的键盘测试', async () => {
        render(TabClosableDemo);
        const tab = document.querySelector('[data-tabkey=semiTab1]') as HTMLElement;
        await userEvent.click(tab);
        expect(tab).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(document.querySelector('[data-tabkey=semiTab1]')).toBeNull());
    });

    // Reads Chrome's accessibility tree over CDP
    it.skipIf(!isChromium)('可关闭页签的关闭按钮出现在 Chrome 的无障碍树中', async () => {
        render(TabClosableDemo);
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frame = frameTree?.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
        if (!frame) throw new Error('vitest-iframe frame not found');
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
        const exposed = nodes.filter((node) => !node.ignored);
        const closeButtons = exposed.filter((node) => node.role?.value === 'button' && node.name?.value === zh_CN.Tabs.close);
        expect(closeButtons).toHaveLength(8);
    });

    it('Tabs 挂载并折叠后，activeTab 位于视口内', async () => {
        const { container } = render(CollapseScrollIntoViewDemo);
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-9' }), scrollWrapper(container))).toBe(true));
    });

    it('showRestInDropdown', async () => {
        const { container } = render(() => cardTabs(30, { showRestInDropdown: false }));
        await expectArrows(container, { start: false, end: true });
        await userEvent.hover(arrowButton(container, 'end'));
        // wait past the dropdown's hover delay before asserting it never opened
        await sleep(500);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-content .${BASE_CLASS_PREFIX}-dropdown-item`)).toBeNull();
    });

    it.each(['line', 'card', 'button', 'slash'] as const)('%s 类型的标签显示主题焦点环', async (type) => {
        const { container } = render(() => <Tabs type={type}>{() => [pane('1', 'one', () => 'one'), pane('2', 'two', () => 'two')]}</Tabs>);
        const tab = container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-tab`) as HTMLElement;
        await tabTo(tab);
        expectThemeFocusRing(tab);
    });

    it.each(['ltr', 'rtl'] as const)('#tabBarExtraContent 位于 %s 标签栏的行内末端', (direction) => {
        const { container } = render(() => (
            <ConfigProvider direction={direction}>
                {() => (
                    <div style={{ width: '600px' }}>
                        <Tabs>
                            {{
                                default: () => [pane('1', 'one', () => 'one'), pane('2', 'two', () => 'two')],
                                tabBarExtraContent: () => <button type="button">Extra</button>,
                            }}
                        </Tabs>
                    </div>
                )}
            </ConfigProvider>
        ));
        const bar = (container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar`) as HTMLElement).getBoundingClientRect();
        const extra = (container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar-extra`) as HTMLElement).getBoundingClientRect();
        const gapToInlineEnd = direction === 'rtl' ? extra.left - bar.left : bar.right - extra.right;
        expect(gapToInlineEnd).toBeCloseTo(0, 0);
    });

    it('collapsible="auto" 在折叠布局能放下全部标签的宽度上也不会来回切换', async () => {
        const keys = ['a', 'b', 'c', 'd', 'e'];
        const tabs = (width: number, collapsible?: 'auto') => (
            <Tabs type="card" style={{ width: `${width}px` }} collapsible={collapsible}>
                {() => keys.map((key) => pane(key, key === 'e' ? 'a very long tab title that is wide enough to stay mostly visible beside the arrows' : `tab-title-${key}`, () => key))}
            </Tabs>
        );
        const probe = render(() => tabs(2000));
        const nodes = [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tabs-tab`)];
        const total = nodes[nodes.length - 1].getBoundingClientRect().right - nodes[0].getBoundingClientRect().left;
        probe.unmount();
        for (const delta of [1, 17, 25, 49]) {
            const view = render(() => tabs(Math.floor(total - delta), 'auto'));
            let changes = 0;
            const observer = new MutationObserver(() => {
                changes++;
            });
            observer.observe(view.container.querySelector(`.${BASE_CLASS_PREFIX}-tabs-bar`) as Element, { attributes: true, attributeFilter: ['class'] });
            await sleep(400);
            observer.disconnect();
            expect(changes, `delta=${delta}`).toBeLessThanOrEqual(1);
            view.unmount();
        }
    });
});
