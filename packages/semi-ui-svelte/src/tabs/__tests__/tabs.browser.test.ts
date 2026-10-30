import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, isChromium, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { TabsProps } from '../interface';
import TabsConfig from './tabs-config.svelte';
import TabsFixture, { type FixtureStore, type Pane } from './tabs-fixture.svelte';

const prefix = `${BASE_CLASS_PREFIX}-tabs`;
const overflowPrefix = `${BASE_CLASS_PREFIX}-overflow-list`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const docPanes: Pane[] = [
    ['文档', '1'],
    ['快速起步', '2'],
    ['帮助', '3'],
    ['关于', '4'],
    ['资源工具', '5'],
].map(([tab, itemKey]) => ({ itemKey, tab, content: tab }));

const numbered = (keys: readonly (string | number)[]): Pane[] => keys.map((key) => ({ itemKey: `${key}`, tab: `tab-${key}`, content: `Content of tab ${key}` }));

type Extra = Partial<Omit<FixtureStore, 'props' | 'panes'>>;

function setup(props: TabsProps = {}, panes: Pane[] = docPanes, extra: Extra = {}) {
    const store = createStore<FixtureStore>({ props, panes, ...extra });
    const view = render(TabsFixture, { props: { store } });
    flushSync();
    return { ...view, store };
}

const tabByKey = (itemKey: string) => document.querySelector(`[data-tabkey="semiTab${itemKey}"]`) as HTMLElement;
const getBar = () => document.querySelector(`.${prefix}-bar`) as HTMLElement;
const textOf = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim();
const tabNames = () => screen.getAllByRole('tab').map(textOf);
const activePane = () => document.querySelector(`.${prefix}-pane-active`) as HTMLElement;
const arrowButton = (position: string) => document.querySelector(`.${prefix}-bar-arrow-${position} .${BASE_CLASS_PREFIX}-button`) as HTMLButtonElement;
const scrollWrapper = () => document.querySelector(`.${overflowPrefix}-scroll-wrapper`) as HTMLElement;

function isInside(inner: Element, outer: Element) {
    const a = inner.getBoundingClientRect();
    const b = outer.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1;
}

const expectArrows = ({ start, end }: { start: boolean; end: boolean }) =>
    waitFor(() => {
        expect(arrowButton('start')).toHaveProperty('disabled', !start);
        expect(arrowButton('end')).toHaveProperty('disabled', !end);
    });

describe('Svelte Tabs（浏览器）', () => {
    it('水平标签栏的键盘操作：跳过禁用标签，Home、End 与循环', async () => {
        setup(
            {},
            docPanes.map((pane) => ({ ...pane, disabled: ['3', '4'].includes(pane.itemKey) }))
        );
        await userEvent.click(tabByKey('2'));
        expect(tabByKey('2')).toHaveFocus();

        await userEvent.keyboard('{ArrowRight}');
        expect(tabByKey('5')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(tabByKey('1')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tabByKey('5')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tabByKey('1')).toHaveFocus();
        await userEvent.keyboard('{End}');
        expect(tabByKey('5')).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{Tab}');
        expect(document.getElementById(tabByKey('5').getAttribute('aria-controls') ?? '')).toHaveFocus();
    });

    it('垂直标签栏使用上下方向键', async () => {
        setup({ tabPosition: 'left' });
        await userEvent.click(tabByKey('1'));
        await userEvent.keyboard('{ArrowDown}');
        expect(tabByKey('2')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(tabByKey('1')).toHaveFocus();
    });

    it('RTL 标签栏中左右方向键互换', async () => {
        const store = createStore<FixtureStore>({ props: {}, panes: docPanes });
        render(TabsConfig, { props: { store, direction: 'rtl' } });
        await userEvent.click(tabByKey('1'));
        await userEvent.keyboard('{ArrowLeft}');
        expect(tabByKey('2')).toHaveFocus();
    });

    it('可关闭标签按 Backspace 关闭后，焦点移到相邻标签', async () => {
        const store = createStore<FixtureStore>({
            props: {
                onTabClose: (key: string) => {
                    store.panes = store.panes.filter((pane) => pane.itemKey !== key);
                },
            },
            panes: docPanes.slice(0, 3).map((pane) => ({ ...pane, closable: true })),
        });
        render(TabsFixture, { props: { store } });
        await userEvent.click(tabByKey('1'));
        expect(tabByKey('1')).toHaveFocus();
        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(document.querySelector('[data-tabkey=semiTab1]')).toBeNull());
        expect(document.activeElement).toHaveAttribute('data-tabkey', 'semiTab2');
    });

    it('关闭按钮可用鼠标点击，且不切换标签', async () => {
        const store = createStore<FixtureStore>({
            props: {
                onTabClose: (key: string) => {
                    store.panes = store.panes.filter((pane) => pane.itemKey !== key);
                },
            },
            panes: docPanes.slice(0, 3).map((pane) => ({ ...pane, closable: true })),
        });
        render(TabsFixture, { props: { store } });
        const [firstClose, , thirdClose] = screen.getAllByRole('button', { name: zh_CN.Tabs.close });
        await userEvent.click(thirdClose);
        await waitFor(() => expect(tabNames()).toEqual(['文档', '快速起步']));
        expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('文档');
        await userEvent.click(firstClose);
        await waitFor(() => expect(tabNames()).toEqual(['快速起步']));
    });

    it.each(['line', 'card', 'button', 'slash'] as const)('%s 类型的标签显示主题焦点环', async (type) => {
        setup({ type }, docPanes.slice(0, 2));
        const tab = document.querySelector(`.${prefix}-tab`) as HTMLElement;
        await tabTo(tab);
        expectThemeFocusRing(tab);
    });

    it.each(['ltr', 'rtl'] as const)('tabBarExtraContent 位于 %s 标签栏的行内末端', (direction) => {
        const store = createStore<FixtureStore>({ props: { style: 'width: 600px' }, panes: docPanes.slice(0, 2), snippets: ['extra'] });
        render(TabsConfig, { props: { store, direction } });
        const bar = getBar().getBoundingClientRect();
        const extra = (document.querySelector(`.${prefix}-bar-extra`) as HTMLElement).getBoundingClientRect();
        const gapToInlineEnd = direction === 'rtl' ? extra.left - bar.left : bar.right - extra.right;
        expect(gapToInlineEnd).toBeCloseTo(0, 0);
    });

    it('面板滑入动画在真实 animationend 后去掉方向 class', async () => {
        setup();
        await userEvent.click(screen.getByRole('tab', { name: '帮助' }));
        const overlay = activePane().querySelector(`.${prefix}-pane-motion-overlay`) as HTMLElement;
        expect(overlay).toHaveClass(`${prefix}-pane-animate-leftShow`);
        await expect.poll(() => overlay.className).not.toContain('animate');
    });

    it('more 的菜单可用鼠标选择，被收进菜单的标签在选中后仍以面板名称呈现', async () => {
        setup({ more: { count: 2, dropdownProps: { trigger: 'click' } } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.more }));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items.find((item) => textOf(item) === '关于') as HTMLElement);
        await waitFor(() => expect(activePane()).toHaveTextContent('关于'));
        expect(screen.getByRole('tabpanel', { name: '关于' })).toBe(activePane());
    });

    // Reads Chrome's accessibility tree over CDP: Y-Q16, a tab must stay an owned child of the tablist while OverflowList
    // wraps each collapsed tab in a `display: contents` span
    it.skipIf(!isChromium).each([false, true])('Chrome 的无障碍树中，所有 tab 都直接属于 tablist（collapsible=%s）', async (collapsible) => {
        setup({ collapsible, type: 'card', style: 'width: 300px', 'aria-label': 'docs' } as TabsProps, numbered([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
        await sleep(300);
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frame = frameTree?.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
        if (!frame) throw new Error('vitest-iframe frame not found');
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
        const byId = new Map(nodes.map((node) => [node.nodeId, node]));
        const tabs = nodes.filter((node) => node.role?.value === 'tab');
        expect(tabs).toHaveLength(10);
        for (const node of tabs) {
            const parent = node.parentId ? byId.get(node.parentId) : undefined;
            expect(parent?.role?.value, `parent of ${node.name?.value}`).toBe('tablist');
            expect(parent?.name?.value).toBe('docs');
        }
    });

    it.skipIf(!isChromium)('可关闭标签的关闭按钮出现在 Chrome 的无障碍树中', async () => {
        setup(
            {},
            docPanes.slice(0, 3).map((pane) => ({ ...pane, closable: true }))
        );
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frame = frameTree?.childFrames?.find((child) => child.frame.name === 'vitest-iframe')?.frame;
        if (!frame) throw new Error('vitest-iframe frame not found');
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId: frame.id });
        const closeButtons = nodes.filter((node) => !node.ignored && node.role?.value === 'button' && node.name?.value === zh_CN.Tabs.close);
        expect(closeButtons).toHaveLength(3);
    });
});

describe('Svelte Tabs 折叠（浏览器）', () => {
    const wide = (extra: TabsProps = {}) => ({ collapsible: true, type: 'card', style: 'width: 300px', ...extra }) as TabsProps;

    it('折叠模式下方向键与 Home、End 在整个 tablist 内移动，焦点所在的标签滚入可见区域', async () => {
        setup(wide(), numbered([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
        await expectArrows({ start: false, end: true });
        await userEvent.click(screen.getByRole('tab', { name: 'tab-0' }));
        await userEvent.keyboard('{End}');
        expect(screen.getByRole('tab', { name: 'tab-9' })).toHaveFocus();
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'tab-9' }), scrollWrapper())).toBe(true));
        await userEvent.keyboard('{ArrowRight}');
        expect(screen.getByRole('tab', { name: 'tab-0' })).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(screen.getByRole('tab', { name: 'tab-9' })).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(screen.getByRole('tab', { name: 'tab-0' })).toHaveFocus();
    });

    it('选择标签并滚动后，折叠箭头保持同步', async () => {
        const keys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const { store } = setup(wide(), numbered(keys));
        await expectArrows({ start: false, end: true });

        await userEvent.click(screen.getByRole('tab', { name: 'tab-2' }));
        await expectArrows({ start: false, end: true });
        await userEvent.hover(arrowButton('end'));
        const menuTexts = (await screen.findAllByRole('menuitemcheckbox')).map(textOf);
        expect(menuTexts).toContain('tab-9');
        expect(menuTexts).not.toContain('tab-0');
        await userEvent.unhover(arrowButton('end'));

        store.panes = numbered([8, 9, 10, 11, 12, 13, 14, 15]);
        await waitFor(() => expect(tabNames()).toContain('tab-15'));
        await expectArrows({ start: false, end: true });
    });

    it('受控 activeKey 变化时，将溢出的标签滚动到可见区域', async () => {
        const { store } = setup(
            wide({ style: 'width: 500px', activeKey: 'tab-0' }),
            Array.from({ length: 10 }, (_, i) => ({ itemKey: `tab-${i}`, tab: `Tab-${i}` }))
        );
        const tab7 = screen.getByRole('tab', { name: 'Tab-7' });
        await expectArrows({ start: false, end: true });
        expect(isInside(tab7, scrollWrapper())).toBe(false);

        store.props.activeKey = 'tab-7';
        await waitFor(() => expect(isInside(tab7, scrollWrapper())).toBe(true));

        store.props.activeKey = 'tab-0';
        await waitFor(() => expect(isInside(screen.getByRole('tab', { name: 'Tab-0' }), scrollWrapper())).toBe(true));
    });

    it('标签栏在视口外时切换 activeKey，只滚动标签栏，不滚动页面', async () => {
        window.scrollTo(0, 0);
        const spacer = document.createElement('div');
        spacer.style.height = '3000px';
        document.body.prepend(spacer);
        try {
            const { store } = setup(
                wide({ style: 'width: 500px', activeKey: 'k0' }),
                numbered([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).map((pane) => ({ ...pane, itemKey: `k${pane.itemKey}` }))
            );
            const tab7 = screen.getByRole('tab', { name: 'tab-7' });
            await sleep(300);
            store.props.activeKey = 'k7';
            await waitFor(() => expect(isInside(tab7, scrollWrapper())).toBe(true));
            expect(window.scrollY).toBe(0);
        } finally {
            spacer.remove();
        }
    });

    it('itemKey 含双引号与空格时，切换 activeKey 能滚动到该标签且不抛错', async () => {
        const keys = ['plain 0', 'q"1', ...Array.from({ length: 8 }, (_, i) => `tab "${i + 2}" x`)];
        const { store } = setup(wide({ activeKey: keys[0] }), numbered(keys));
        const last = screen.getByRole('tab', { name: `tab-${keys.at(-1)}` });
        await expectArrows({ start: false, end: true });
        expect(isInside(last, scrollWrapper())).toBe(false);

        store.props.activeKey = keys.at(-1) as string;
        await waitFor(() => expect(isInside(last, scrollWrapper())).toBe(true));
    });

    it('快速点击末尾箭头时保留所有标签，到末尾后箭头禁用', async () => {
        setup(wide({ style: 'width: 250px' }), numbered(['Tab-10', 'Tab-2324325324324', 'Tab-1111']));
        await expectArrows({ start: false, end: true });

        // Clicks during the smooth scroll land while no tab is fully visible; DOM clicks, because the arrow button is
        // re-rendered and may turn disabled between two real pointer clicks.
        const scrollLeft = () => scrollWrapper().scrollLeft;
        for (let i = 0; i < 5 && !arrowButton('end').disabled; i++) {
            const before = scrollLeft();
            arrowButton('end').click();
            await expect.poll(() => scrollLeft() !== before || arrowButton('end').disabled).toBe(true);
        }
        await expect
            .poll(
                () => {
                    arrowButton('end').click();
                    return arrowButton('end').disabled;
                },
                { interval: 500, timeout: 3000 }
            )
            .toBe(true);

        await expectArrows({ start: true, end: false });
        expect(tabNames()).toEqual(['tab-Tab-10', 'tab-Tab-2324325324324', 'tab-Tab-1111']);
    });

    // 461px is 60% of the 768px page the original demo used; at that width Tab-6 is the first collapsed tab
    it('从箭头菜单选择被折叠的标签后切换面板，再回到前面的标签', async () => {
        setup(
            wide({ style: 'width: 461px' }),
            Array.from({ length: 30 }, (_, i) => ({ itemKey: `Tab-${i}`, tab: `Tab-${i}`, content: `Content of card tab ${i}` }))
        );
        expect(activePane()).toHaveTextContent('Content of card tab 0');

        await expectArrows({ start: false, end: true });
        await userEvent.hover(arrowButton('end'));
        const menuItems = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(menuItems.find((item) => textOf(item) === 'Tab-6') as HTMLElement);
        await waitFor(() => expect(activePane()).toHaveTextContent('Content of card tab 6'));

        await waitFor(() => expect(arrowButton('start')).toBeEnabled());
        await userEvent.click(arrowButton('start'), { force: true });
        await userEvent.click(screen.getByRole('tab', { name: 'Tab-3' }), { force: true });
        await waitFor(() => expect(activePane()).toHaveTextContent('Content of card tab 3'));
    });

    it('showRestInDropdown=false 时箭头不打开菜单', async () => {
        setup(wide({ showRestInDropdown: false }), numbered(Array.from({ length: 30 }, (_, i) => i)));
        await expectArrows({ start: false, end: true });
        await userEvent.hover(arrowButton('end'));
        // Asserting an absence: wait past the dropdown's hover delay before checking it never opened
        await sleep(500);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-content .${BASE_CLASS_PREFIX}-dropdown-item`)).toBeNull();
    });

    describe('collapsible="auto"', () => {
        const longTitle = 'a very long tab title that is wide enough to stay mostly visible beside the arrows';
        const autoPanes: Pane[] = ['a', 'b', 'c', 'd', 'e'].map((key) => ({ itemKey: key, tab: key === 'e' ? longTitle : `tab-title-${key}`, content: key }));

        // the width the five tabs need side by side, measured without collapsing
        const measure = () => {
            const probe = setup({ type: 'card', style: 'width: 2000px' }, autoPanes);
            const nodes = [...document.querySelectorAll<HTMLElement>(`.${prefix}-tab`)];
            const total = (nodes.at(-1) as HTMLElement).getBoundingClientRect().right - nodes[0].getBoundingClientRect().left;
            probe.unmount();
            return total;
        };

        it('在折叠布局能放下全部标签的宽度上也不会来回切换', async () => {
            const total = measure();
            for (const delta of [1, 17, 25, 49]) {
                const { unmount } = setup({ collapsible: 'auto', type: 'card', style: `width: ${Math.floor(total - delta)}px` }, autoPanes);
                let changes = 0;
                const observer = new MutationObserver(() => changes++);
                observer.observe(getBar(), { attributes: true, attributeFilter: ['class'] });
                await sleep(400);
                observer.disconnect();
                expect(changes, `delta=${delta}`).toBeLessThanOrEqual(1);
                unmount();
            }
        });

        it('受控页签点击后不会来回切换', async () => {
            const total = measure();
            for (const delta of [1, 17, 25, 49]) {
                const { store, unmount } = setup({ collapsible: 'auto', type: 'card', style: `width: ${Math.floor(total - delta)}px`, activeKey: 'a', onChange: (key: string) => (store.props.activeKey = key) }, autoPanes);
                await sleep(400);
                expect(getBar().className, `delta=${delta}`).toContain(`${prefix}-bar-collapse`);
                let changes = 0;
                const observer = new MutationObserver(() => changes++);
                observer.observe(getBar(), { attributes: true, attributeFilter: ['class'] });
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
});
