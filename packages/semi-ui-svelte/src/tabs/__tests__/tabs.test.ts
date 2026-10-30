import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserverCore } from '@test/utils/dom/resize-observer-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { TabsProps } from '../interface';
import TabItemFixture from './tab-item-fixture.svelte';
import TabsConfig from './tabs-config.svelte';
import TabsFixture, { type FixtureStore, type Pane } from './tabs-fixture.svelte';
import TabsModes from './tabs-modes.svelte';

// jsdom has no layout, so these tests assert the native scrollIntoView path; the fallback is covered by supports.test.ts
vi.mock('@fibrae/semi-foundation/utils/supports', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@fibrae/semi-foundation/utils/supports')>()),
    scrollIntoViewWithin: (el: Element, _scroller: HTMLElement, options: ScrollIntoViewOptions) => el.scrollIntoView({ ...options, container: 'nearest' } as ScrollIntoViewOptions),
}));

const prefix = `${BASE_CLASS_PREFIX}-tabs`;

const twoPanes: Pane[] = [
    { itemKey: 'itemKeyA', tab: 'titleA', content: 'contentA' },
    { itemKey: 'itemKeyB', tab: 'titleB', content: 'contentB' },
];
const threePanes: Pane[] = [
    { itemKey: 'a', tab: 'A', content: 'content a' },
    { itemKey: 'b', tab: 'B', content: 'content b' },
    { itemKey: 'c', tab: 'C', content: 'content c' },
];
const keyPanes = (keys: string[], extra: Partial<Pane> = {}): Pane[] => keys.map((key) => ({ itemKey: key, tab: `tab-${key}`, ...extra }));

type Extra = Partial<Omit<FixtureStore, 'props' | 'panes'>>;

function setup(props: TabsProps = {}, panes: Pane[] = threePanes, extra: Extra = {}) {
    const store = createStore<FixtureStore>({ props, panes, ...extra });
    const view = render(TabsFixture, { props: { store } });
    flushSync();
    return { ...view, store };
}

async function settle() {
    flushSync();
    await tick();
    await tick();
}

async function click(element: Element) {
    await userEvent.click(element);
    flushSync();
}

async function press(keys: string) {
    await userEvent.keyboard(keys);
    flushSync();
}

const tab = (name: string) => screen.getByRole('tab', { name });
const textOf = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim();
const tabNames = () => screen.getAllByRole('tab').map(textOf);
function selectedTab() {
    const selected = screen.queryByRole('tab', { selected: true });
    return selected ? textOf(selected) : null;
}
const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');
const getBar = () => document.querySelector(`.${prefix}-bar`) as HTMLElement;
const getRoot = () => document.querySelector(`.${prefix}`) as HTMLElement;
const getContent = () => document.querySelector(`.${prefix}-content`) as HTMLElement;
const paneOf = (itemKey: string) => document.querySelector(`[role="tabpanel"][id$="-panel-${itemKey}"]`) as HTMLElement;
const overlayOf = (itemKey: string) => paneOf(itemKey).querySelector(`.${prefix}-pane-motion-overlay`) as HTMLElement;
const overlayClass = (itemKey: string) => overlayOf(itemKey).className;
const closeButtons = () => screen.queryAllByRole('button', { name: zh_CN.Tabs.close });
const arrow = (position: string) => document.querySelector(`.${prefix}-bar-arrow-${position}`) as HTMLElement;
const arrowButton = (position: string) => arrow(position).querySelector('button') as HTMLButtonElement;

const scrollSpy = () => vi.spyOn(Element.prototype, 'scrollIntoView');

function stubIntersectionObserver() {
    interface StubObserver {
        callback: (entries: unknown[]) => void;
        elements: Set<Element>;
    }
    const observers: StubObserver[] = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            callback: (entries: unknown[]) => void;
            elements = new Set<Element>();
            constructor(callback: (entries: unknown[]) => void) {
                this.callback = callback;
                observers.push(this);
            }
            observe(element: Element) {
                this.elements.add(element);
            }
            unobserve(element: Element) {
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
        observed: () => live().flatMap((observer) => [...observer.elements] as HTMLElement[]),
        intersect: async (visibility: Record<string, boolean>) => {
            for (const observer of live()) {
                observer.callback(
                    [...observer.elements].map((target) => ({
                        target,
                        isIntersecting: Boolean(visibility[(target as HTMLElement).dataset.scrollkey ?? '']),
                        boundingClientRect: { y: 0 },
                    }))
                );
            }
            await settle();
        },
    };
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Tabs', () => {
    it('基础渲染 tabs', () => {
        setup({}, twoPanes);
        expect(getContent().children).toHaveLength(2);
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-tab-active`)).toHaveTextContent(/^titleA$/);
        expect(tab('titleA')).toHaveAttribute('aria-selected', 'true');
    });

    it('Tabs 带自定义 class、style 和 contentStyle', () => {
        setup({ class: 'test', style: 'color: red', contentStyle: 'color: blue' }, twoPanes);
        expect(getRoot()).toHaveClass('test', prefix);
        expect(getRoot()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getContent()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('不同类型的 Tabs', () => {
        const typeOf = (type: TabsProps['type']) => {
            const { unmount } = setup({ type }, twoPanes);
            const result = { button: getBar().classList.contains(`${prefix}-bar-button`), card: getBar().classList.contains(`${prefix}-bar-card`) };
            unmount();
            return result;
        };
        expect(typeOf('line')).toEqual({ button: false, card: false });
        expect(typeOf('card')).toEqual({ button: false, card: true });
        expect(typeOf('button')).toEqual({ button: true, card: false });
    });

    it('没有 panel 时 children 是内容区，只有所选标签指向它，内容区以该标签命名', () => {
        setup({ activeKey: 'b' }, threePanes, { content: true });
        expect(getContent().children).toHaveLength(0);
        expect(getContent()).toHaveTextContent(/^content$/);
        const panel = screen.getByRole('tabpanel');
        expect(panel).toBe(getContent());
        expect(panel).toHaveAccessibleName('B');
        expect(screen.getAllByRole('tab').map((item) => item.getAttribute('aria-controls'))).toEqual([null, panel.id, null]);
    });

    it('tabList 为空时没有标签，内容区不引用不存在的标签', () => {
        setup({}, [], { content: true });
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        expect(screen.queryAllByRole('tabpanel')).toHaveLength(0);
        expect(document.querySelector('[aria-labelledby]')).toBeNull();
        expect(getRoot()).toHaveTextContent('content');
    });

    it('点击禁用的标签时不切换', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onChange }, [twoPanes[0], { ...twoPanes[1], disabled: true }]);
        const disabledTabs = document.querySelectorAll(`.${prefix}-tab-disabled`);
        expect(disabledTabs).toHaveLength(1);
        expect(disabledTabs[0]).toHaveTextContent(/^titleB$/);
        await click(tab('titleB'));
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('titleA');
    });

    it('onTabClick 接收 key 和事件；点击已选中的标签不触发 onChange', async () => {
        const onTabClick = vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>();
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onTabClick, onChange });
        await click(tab('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(onTabClick).toHaveBeenCalledTimes(1);
        expect(onTabClick.mock.lastCall?.[0]).toBe('a');
        expect(onTabClick.mock.lastCall?.[1]).toMatchObject({ type: 'click' });
        await click(tab('C'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
        expect(onTabClick.mock.lastCall?.[0]).toBe('c');
        expect(selectedTab()).toBe('C');
    });

    it('键盘激活时 onTabClick 收到 keydown 事件', async () => {
        const onTabClick = vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>();
        setup({ onTabClick });
        tab('B').focus();
        await press('{Enter}');
        expect(onTabClick).toHaveBeenCalledExactlyOnceWith('b', expect.objectContaining({ type: 'keydown' }));
    });

    it('禁用标签聚焦后按 Enter 或 Space 不激活', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onChange }, [threePanes[0], { ...threePanes[1], disabled: true }]);
        tab('B').focus();
        await press('{Enter}');
        await press(' ');
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });

    it('activeKey 变化时更新，null 不选中任何标签', async () => {
        const { store } = setup(
            { activeKey: 'a' },
            twoPanes.map((pane, i) => ({ ...pane, itemKey: ['a', 'b'][i] }))
        );
        expect(selectedTab()).toBe('titleA');
        store.props.activeKey = 'b';
        flushSync();
        expect(selectedTab()).toBe('titleB');
        store.props.activeKey = null;
        flushSync();
        expect(selectedTab()).toBeNull();
        expect(tabStops().map(textOf)).toEqual(['titleA']);
    });

    it('单向传入 activeKey 为 null 时，点击在本地选中并通知，父级再推值时以父级为准', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        const { store } = setup({ activeKey: null, onChange });
        expect(selectedTab()).toBeNull();
        await click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('B');
        store.props.activeKey = 'c';
        flushSync();
        expect(selectedTab()).toBe('C');
    });

    it('activeKey 不在标签中时不选中任何标签，第一个启用的标签是唯一的 Tab 停靠点', () => {
        setup({ activeKey: 'missing' }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]);
        expect(selectedTab()).toBeNull();
        expect(tabStops().map(textOf)).toEqual(['B']);
    });

    it('tabList 从空变为非空后，非受控的 Tabs 选中第一个可用标签', async () => {
        const { store } = setup({}, []);
        store.panes = [
            { itemKey: 'a', tab: '甲', disabled: true },
            { itemKey: 'b', tab: '乙' },
        ];
        flushSync();
        expect(tab('乙')).toHaveAttribute('aria-selected', 'true');
        expect(tab('甲')).toHaveAttribute('aria-selected', 'false');
    });

    it('closable：关闭图标和 Backspace、Delete 触发 onTabClose，而非 onTabClick', async () => {
        const onTabClose = vi.fn<(tabKey: string) => void>();
        const onTabClick = vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>();
        setup(
            { onTabClose, onTabClick },
            threePanes.map((pane) => ({ ...pane, closable: pane.itemKey !== 'c' }))
        );
        expect(closeButtons()).toHaveLength(2);
        await click(closeButtons()[1]);
        expect(onTabClose).toHaveBeenCalledExactlyOnceWith('b');
        expect(onTabClick).not.toHaveBeenCalled();

        screen.getAllByRole('tab')[0].focus();
        await press('{Backspace}');
        expect(onTabClose).toHaveBeenLastCalledWith('a');
        expect(screen.getAllByRole('tab')[1]).toHaveFocus();
        screen.getAllByRole('tab')[2].focus();
        await press('{Delete}');
        expect(onTabClose).toHaveBeenCalledTimes(2);
    });

    it('closable：禁用标签的关闭图标照常显示，点击或按键都不关闭', async () => {
        const onTabClose = vi.fn<(tabKey: string) => void>();
        const onTabClick = vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>();
        setup({ onTabClose, onTabClick }, [threePanes[0], { ...threePanes[1], disabled: true, closable: true }]);
        expect(closeButtons()).toHaveLength(1);
        await click(closeButtons()[0]);
        screen.getAllByRole('tab')[1].focus();
        await press('{Backspace}');
        await press('{Delete}');
        expect(onTabClose).not.toHaveBeenCalled();
        expect(onTabClick).not.toHaveBeenCalled();
    });

    it('关闭当前标签后，非受控的 Tabs 回退到第一个启用的标签', async () => {
        const { store } = setup(
            {},
            threePanes.map((pane) => ({ ...pane, closable: true }))
        );
        await click(tab('B').closest('[role=tab]') as Element);
        expect(selectedTab()).toBe('B');
        store.panes = threePanes.filter((pane) => pane.itemKey !== 'b');
        flushSync();
        await settle();
        expect(selectedTab()).toBe('A');
    });

    it('新增标签时选中第一个；删除已选中的标签时回退到第一个启用的标签；前面插入标签选中项不变', async () => {
        const first = setup({}, []);
        first.store.panes = threePanes;
        flushSync();
        expect(selectedTab()).toBe('A');
        first.store.panes = threePanes.slice(1);
        flushSync();
        await settle();
        expect(selectedTab()).toBe('B');
        first.unmount();

        const second = setup({}, threePanes.slice(1));
        expect(selectedTab()).toBe('B');
        second.store.panes = threePanes;
        flushSync();
        expect(selectedTab()).toBe('B');
    });

    it('keepDOM=false 时只渲染所选面板', async () => {
        setup({ keepDOM: false });
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content a$/);
        await click(tab('C'));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content c$/);
        expect(screen.getAllByRole('tab').map((item) => item.getAttribute('aria-controls'))).toEqual([null, null, screen.getByRole('tabpanel').id]);
    });

    it('keepDOM=false 且没有选中标签时不渲染任何面板', () => {
        setup({ keepDOM: false, activeKey: null }, [threePanes[0]]);
        expect(screen.queryAllByRole('tabpanel', { hidden: true })).toHaveLength(0);
    });

    it('lazyRender 在面板首次激活时渲染，之后保留', async () => {
        setup({ lazyRender: true });
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
        expect(screen.getByText('content a')).toBeInTheDocument();
        expect(screen.queryByText('content b')).toBeNull();
        await click(tab('B'));
        expect(screen.getByText('content b')).toBeInTheDocument();
        await click(tab('A'));
        expect(screen.getByText('content b')).toBeInTheDocument();
        expect(screen.queryByText('content c')).toBeNull();
    });

    it('type、size 和 tabPosition 在根节点、标签栏、标签和内容上设置类名', () => {
        const { unmount } = setup();
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
        expect(getRoot()).toHaveClass(prefix, `${prefix}-top`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`, `${prefix}-tab-top`, `${prefix}-tab-single`);
        unmount();

        setup({ tabPosition: 'left', size: 'small', type: 'card' });
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
        expect(getBar()).toHaveClass(`${prefix}-bar`, `${prefix}-bar-card`, `${prefix}-bar-left`);
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect(getContent()).toHaveClass(`${prefix}-content-left`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-card`, `${prefix}-tab-left`, `${prefix}-tab-small`);
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-medium`);
    });

    it('roving tabindex，以及标签与面板之间的 aria 关联', () => {
        setup(
            {},
            threePanes.map((pane) => (pane.itemKey === 'b' ? { ...pane, disabled: true } : pane))
        );
        expect(screen.getAllByRole('tab').map((item) => item.tabIndex)).toEqual([0, -1, -1]);
        expect(tab('B')).toHaveAttribute('aria-disabled', 'true');
        expect(tab('A')).toHaveAttribute('aria-disabled', 'false');
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        expect(panels.map((panel) => panel.getAttribute('aria-hidden'))).toEqual(['false', 'true', 'true']);
        expect(panels.map((panel) => panel.tabIndex)).toEqual([0, 0, 0]);
        screen.getAllByRole('tab').forEach((item, i) => {
            expect(item.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(item.id);
        });
        expect(new Set(panels.map((panel) => panel.id)).size).toBe(3);
    });

    it('两个 Tabs 共用 itemKey 时，各面板由各自的标签标识', () => {
        setup({}, [{ itemKey: 'k', tab: 'first', content: 'one' }]);
        setup({}, [{ itemKey: 'k', tab: 'second', content: 'two' }]);
        const [firstPanel, secondPanel] = screen.getAllByRole('tabpanel');
        expect(firstPanel).toHaveAccessibleName('first');
        expect(secondPanel).toHaveAccessibleName('second');
        const [firstTab, secondTab] = screen.getAllByRole('tab');
        expect(firstTab.getAttribute('aria-controls')).toBe(firstPanel.id);
        expect(secondTab.getAttribute('aria-controls')).toBe(secondPanel.id);
    });

    it('itemKey 含双引号与空格时，标签与面板的 id 一一对应', () => {
        setup(
            {},
            ['a "b"', 'c d'].map((key) => ({ itemKey: key, tab: `tab-${key}`, content: key }))
        );
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        screen.getAllByRole('tab').forEach((item, i) => {
            expect(item.id).not.toMatch(/\s/);
            expect(panels[i].id).not.toMatch(/\s/);
            expect(item.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(item.id);
        });
    });

    it('aria-label 与 aria-labelledby 命名 tablist，其余属性仍落在根元素', () => {
        setup({ 'aria-label': '文档导航', 'data-x': 'root', id: 'tabs' } as TabsProps);
        expect(screen.getByRole('tablist', { name: '文档导航' })).toBeInTheDocument();
        expect(getRoot()).not.toHaveAttribute('aria-label');
        expect(getRoot()).toHaveAttribute('data-x', 'root');
        expect(getRoot()).toHaveAttribute('id', 'tabs');
    });

    it('根元素上的原生 click 经属性透传，面板内输入框冒泡的 change 不触发 onChange', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onclick, onChange });
        await click(tab('B'));
        expect(onclick).toHaveBeenCalledTimes(1);
        onChange.mockClear();
        paneOf('a').dispatchEvent(new Event('change', { bubbles: true }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('未知的 Semi 属性不进入 DOM', () => {
        setup({ preventScroll: true });
        expect(getRoot()).not.toHaveAttribute('preventscroll');
        expect(paneOf('a')).not.toHaveAttribute('itemkey');
        expect(paneOf('a')).not.toHaveAttribute('item-key');
    });

    it('extra 位于标签栏中 tablist 之外，浮动到行尾', () => {
        setup({}, threePanes, { snippets: ['extra'] });
        const extra = document.querySelector(`.${prefix}-bar-extra`) as HTMLElement;
        expect(getBar()).toContainElement(extra);
        expect(screen.getByRole('tablist')).not.toContainElement(extra);
        expect(extra).toHaveAttribute('x-semi-prop', 'tabBarExtraContent');
        expect(extra).toHaveClass(`${prefix}-bar-line-extra`, `${prefix}-bar-line-extra-large`);
        expect(extra).toHaveStyle({ float: 'inline-end' });
        expect(screen.getByRole('button', { name: 'Extra' })).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('没有 tabBarExtraContent 时不渲染容器', () => {
        setup();
        expect(document.querySelector(`.${prefix}-bar-extra`)).toBeNull();
    });

    it('tab 与 icon 对每项调用，参数为 { item, index }；没有 tab 时渲染文本', () => {
        const { unmount } = setup({}, twoPanes, { snippets: ['tab', 'icon'] });
        expect(tabNames()).toEqual(['0:titleA', '1:titleB']);
        expect(tab('0:titleA').querySelector(`.${prefix}-bar-icon .own-icon`)).not.toBeNull();
        unmount();

        setup({}, twoPanes, { snippets: ['icon'] });
        expect(tabNames()).toEqual(['titleA', 'titleB']);
    });

    it('标签内控件的按键不触发标签的键盘操作', async () => {
        const onTabClose = vi.fn<(tabKey: string) => void>();
        const onTabClick = vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>();
        setup({ onTabClose, onTabClick }, [{ ...threePanes[0], closable: true }, ...threePanes.slice(1)], { snippets: ['input-tab'] });
        const input = screen.getByRole('textbox', { name: 'name' });
        await click(input);
        onTabClick.mockClear();
        await press('a b');
        expect(input).toHaveValue('a b');
        await press('{Home}{Backspace}{ArrowRight}{End}');
        expect(input).toHaveFocus();
        expect(onTabClose).not.toHaveBeenCalled();
        expect(onTabClick).not.toHaveBeenCalled();
    });

    it('重渲染后，tab 里输入框的值与焦点保留', async () => {
        const { store } = setup({}, threePanes, { snippets: ['input-tab'] });
        const input = screen.getByRole('textbox', { name: 'name' });
        await userEvent.type(input, 'abc');
        store.props.class = 'changed';
        flushSync();
        expect(screen.getByRole('textbox', { name: 'name' })).toBe(input);
        expect(input).toHaveValue('abc');
        expect(input).toHaveFocus();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Tabs: { type: 'card', size: 'small' } };
        const { unmount } = setup();
        expect(getBar()).toHaveClass(`${prefix}-bar-card`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-small`);
        unmount();
        setup({ type: 'button' });
        expect(getBar()).toHaveClass(`${prefix}-bar-button`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-small`);
    });

    it('全局默认值 collapsible 生效，Tabs 外的 TabItem 不受 Tabs 全局值影响', () => {
        semiGlobal.config.overrideDefaultProps = { Tabs: { collapsible: true, type: 'card', size: 'small' } };
        const { unmount } = setup({}, keyPanes(['k0', 'k1', 'k2']));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeInTheDocument();
        unmount();

        render(TabItemFixture);
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-card`);
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-small`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`);
    });

    it('通过 semiGlobalKey 注入的实例只作用于该应用', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Tabs: { tabPosition: 'left', keepDOM: false } };
        const store = createStore<FixtureStore>({ props: {}, panes: threePanes });
        render(TabsFixture, { props: { store }, context: new Map([[semiGlobalKey, semi]]) });
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(semiGlobal.config.overrideDefaultProps).toEqual({});
    });
});

describe('Tabs 键盘', () => {
    it('方向键跳过禁用标签并循环移动，Home 和 End 跳转，Enter 与 Space 选择', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        const panes = [...threePanes, { itemKey: 'd', tab: 'D', disabled: true }, { itemKey: 'e', tab: 'E' }];
        setup(
            { onChange },
            panes.map((pane) => (pane.itemKey === 'c' ? { ...pane, disabled: true } : pane))
        );
        tab('B').focus();
        await press('{ArrowRight}');
        expect(tab('E')).toHaveFocus();
        await press('{ArrowRight}');
        expect(tab('A')).toHaveFocus();
        await press('{ArrowLeft}');
        expect(tab('E')).toHaveFocus();
        await press('{ArrowDown}');
        expect(tab('E')).toHaveFocus();
        await press('{Home}');
        expect(tab('A')).toHaveFocus();
        await press('{End}');
        expect(tab('E')).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
        await press('{Enter}');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('e');
        expect(selectedTab()).toBe('E');
        tab('A').focus();
        await press(' ');
        expect(selectedTab()).toBe('A');
    });

    it('焦点停在禁用标签上时，方向键移到相邻的可用标签', async () => {
        const panes = [...threePanes, { itemKey: 'd', tab: 'D' }, { itemKey: 'e', tab: 'E' }].map((pane) => (pane.itemKey === 'c' ? { ...pane, disabled: true } : pane));
        setup({}, panes);
        tab('C').focus();
        await press('{ArrowRight}');
        expect(tab('D')).toHaveFocus();
        tab('C').focus();
        await press('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
    });

    it('RTL 页面中，水平标签栏的左右方向键互换', async () => {
        const store = createStore<FixtureStore>({ props: {}, panes: threePanes });
        render(TabsConfig, { props: { store, direction: 'rtl' } });
        flushSync();
        tab('A').focus();
        await press('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
        await press('{ArrowRight}{ArrowRight}');
        expect(tab('C')).toHaveFocus();
    });

    it('垂直标签栏使用上下方向键', async () => {
        setup({ tabPosition: 'left' });
        tab('A').focus();
        await press('{ArrowRight}');
        expect(tab('A')).toHaveFocus();
        await press('{ArrowDown}');
        expect(tab('B')).toHaveFocus();
        await press('{ArrowUp}{ArrowUp}');
        expect(tab('C')).toHaveFocus();
    });

    it('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动焦点也不选中', () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onChange });
        tab('B').focus();
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            for (const key of ['ArrowRight', 'Home', 'Enter']) {
                const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
                expect(tab('B').dispatchEvent(event)).toBe(true);
                expect(tab('B')).toHaveFocus();
            }
        }
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('Tabs 受控 activeKey（$bindable）', () => {
    const modes = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: string | null, accept = true) => {
        const store = createStore<{ value: string | null | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
        render(TabsModes, { props: { mode, store } });
        const clickTab = async (name: string) => {
            await fireEvent.click(tab(name));
            flushSync();
        };
        return { store, clickTab };
    };

    it('非受控：点击切换，onChange 收到新 key，点击已选中的标签不再通知', async () => {
        const { store, clickTab } = modes('uncontrolled');
        expect(selectedTab()).toBe('A');
        await clickTab('B');
        expect(selectedTab()).toBe('B');
        await clickTab('B');
        expect(store.log).toEqual(['change b']);
    });

    it('bind:activeKey：点击写回父级，父级改值同步到组件', async () => {
        const { store, clickTab } = modes('bind', 'a');
        await clickTab('B');
        expect(store.value).toBe('b');
        expect(selectedTab()).toBe('B');
        store.value = 'c';
        flushSync();
        expect(selectedTab()).toBe('C');
    });

    it('bind:activeKey 重置为 undefined 后从最后的 key 继续，可以再次点击', async () => {
        const { store, clickTab } = modes('bind', 'a');
        store.value = 'c';
        flushSync();
        store.value = undefined;
        flushSync();
        expect(selectedTab()).toBe('C');
        await clickTab('A');
        expect(selectedTab()).toBe('A');
        expect(store.value).toBe('a');
    });

    it('bind:activeKey 为 null 时不选中任何标签，点击后写回 key', async () => {
        const { store, clickTab } = modes('bind', null);
        expect(selectedTab()).toBeNull();
        await clickTab('B');
        expect(store.value).toBe('b');
        expect(selectedTab()).toBe('B');
    });

    it('函数绑定：setter 拒绝时组件保持原值', async () => {
        const { store, clickTab } = modes('function', 'a', false);
        await clickTab('B');
        expect(store.log).toEqual(['set b', 'change b']);
        expect(store.value).toBe('a');
        expect(selectedTab()).toBe('A');
        await clickTab('B');
        expect(store.log).toHaveLength(4);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store, clickTab } = modes('function', 'a', true);
        await clickTab('B');
        expect(store.value).toBe('b');
        expect(selectedTab()).toBe('B');
    });

    it('单向传值：组件在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
        const { store, clickTab } = modes('one-way', 'a');
        await clickTab('B');
        expect(store.value).toBe('a');
        expect(selectedTab()).toBe('B');
        store.value = 'c';
        flushSync();
        expect(selectedTab()).toBe('C');
        await clickTab('A');
        expect(selectedTab()).toBe('A');
        expect(store.log).toEqual(['change b', 'change a']);
    });
});

describe('Tabs 滑入动画', () => {
    const animate = (direction: string) => `${prefix}-pane-animate-${direction}Show`;

    it('所选面板从上一个标签的一侧滑入', async () => {
        setup();
        expect(overlayClass('a')).not.toContain('animate');
        await click(tab('C'));
        expect(overlayClass('c')).toContain(animate('left'));
        expect(overlayClass('a')).not.toContain('animate');
        await click(tab('B'));
        expect(overlayClass('b')).toContain(animate('right'));
    });

    it('垂直标签栏上下滑动，tabPaneMotion=false 时关闭动画', async () => {
        const { unmount } = setup({ tabPosition: 'left' });
        await click(tab('B'));
        expect(overlayClass('b')).toContain(animate('top'));
        await click(tab('A'));
        expect(overlayClass('a')).toContain(animate('bottom'));
        unmount();

        setup({ tabPaneMotion: false });
        await click(tab('B'));
        expect(overlayClass('b')).not.toContain('animate');
    });

    it('新增并同时选中的面板，或删除所选面板后，不播放动画', async () => {
        const two = threePanes.slice(0, 2);
        const { store } = setup({ activeKey: 'a' }, two);
        store.props.activeKey = 'b';
        flushSync();
        expect(overlayClass('b')).toContain(`${prefix}-pane-animate`);
        store.props.activeKey = 'c';
        store.panes = threePanes;
        flushSync();
        expect(selectedTab()).toBe('C');
        expect(overlayClass('c')).not.toContain(`${prefix}-pane-animate`);

        store.props.activeKey = undefined;
        flushSync();
        store.panes = two;
        flushSync();
        await settle();
        expect(selectedTab()).toBe('A');
        expect(overlayClass('a')).not.toContain(`${prefix}-pane-animate`);
    });

    // jsdom has no AnimationEvent
    const endAnimation = async (target: Node) => {
        target.dispatchEvent(new Event('animationend', { bubbles: true }));
        await settle();
    };

    it('动画结束后去掉面板的方向 class，再次选中时重新播放', async () => {
        const { store } = setup({ activeKey: 'a' });
        store.props.activeKey = 'b';
        flushSync();
        await endAnimation(overlayOf('b'));
        expect(overlayClass('b')).not.toContain(`${prefix}-pane-animate`);
        store.props.activeKey = 'a';
        flushSync();
        store.props.activeKey = 'b';
        flushSync();
        expect(overlayClass('b')).toContain(`${prefix}-pane-animate`);
    });

    it('面板内容冒泡上来的 animationend 不结束面板动画', async () => {
        const { store } = setup(
            { activeKey: 'a' },
            threePanes.map((pane) => ({ ...pane, content: pane.content }))
        );
        store.props.activeKey = 'b';
        flushSync();
        const inner = document.createElement('span');
        overlayOf('b').append(inner);
        await endAnimation(inner);
        expect(overlayClass('b')).toContain(`${prefix}-pane-animate`);
    });
});

describe('Tabs 自定义标签栏', () => {
    it('tabBar 里的 TabItem 控制其所在 Tabs 的面板，点击选中并只通知一次', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onChange, activeKey: undefined }, threePanes, { snippets: ['item-bar'] });
        expect(screen.getByRole('tabpanel')).toHaveAccessibleName('A');
        expect(selectedTab()).toBe('A');
        await click(tab('B'));
        expect(selectedTab()).toBe('B');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(screen.getByRole('tabpanel')).toHaveAccessibleName('B');
    });

    it('tabBar 接收只含数据的标签栏属性和默认标签栏', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ onChange, tabBarClassName: 'bar', tabBarStyle: 'color: red' }, threePanes, { snippets: ['wrap-bar'] });
        const bar = document.querySelector(`.wrap .${prefix}-bar`);
        expect(bar).toHaveClass('bar');
        expect(bar).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        await click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
    });

    it('activeKey 为 null 时，自定义标签栏里第一个标签是唯一的 Tab 停靠点', () => {
        setup({ activeKey: null }, threePanes.slice(0, 2), { snippets: ['item-bar'] });
        expect(tabStops().map(textOf)).toEqual(['A']);
    });
});

describe('TabItem', () => {
    it('Tabs 外部的 TabItem 没有悬空的 id 或 aria-controls，类名回落到 line 与 top', async () => {
        render(TabItemFixture, { props: { itemProps: { closable: true } } });
        expect(tab('A')).not.toHaveAttribute('id');
        expect(tab('A')).not.toHaveAttribute('aria-controls');
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`, `${prefix}-tab-top`);
        expect(tab('A').className).not.toContain('undefined');
        await click(closeButtons()[0]);
        expect(tab('A')).toBeInTheDocument();
    });

    it('role、tabindex 和 aria 状态优先于透传属性，并合并 class 和 style', () => {
        render(TabItemFixture, { props: { inside: true, itemProps: { role: 'button', tabindex: 5, 'aria-selected': 'false', id: 'own', class: 'extra', style: 'opacity: 0.5', 'data-x': '1' } as never } });
        const element = tab('A');
        expect(element).toHaveAttribute('tabindex', '0');
        expect(element).toHaveAttribute('aria-selected', 'true');
        expect(element.id).not.toBe('own');
        expect(element).toHaveClass('extra', `${prefix}-tab`);
        expect(element).toHaveStyle({ opacity: '0.5' });
        expect(element).toHaveAttribute('data-x', '1');
    });

    it('onClick 的参数为 itemKey 与事件，禁用时不触发；使用方的 keydown 先于标签的键盘处理', async () => {
        const onClick = vi.fn<(itemKey: string, event: MouseEvent) => void>();
        const order: string[] = [];
        const onkeydown = vi.fn<(event: KeyboardEvent) => void>(() => order.push('own'));
        const onTabClick = vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>(() => order.push('tabs'));
        render(TabItemFixture, { props: { inside: true, itemProps: { onClick, onkeydown }, tabsProps: { onTabClick } } });
        await click(tab('A'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith('a', expect.objectContaining({ type: 'click' }));
        await click(tab('B'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(order).toEqual(['tabs']);
        order.length = 0;
        tab('A').focus();
        await press('{Enter}');
        expect(order).toEqual(['own', 'tabs']);
    });
});

describe('Tabs more', () => {
    it('最后的标签收进下拉菜单，可按数量或对象配置', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        const { unmount } = setup({ more: 1, onChange });
        expect(tabNames()).toEqual(['A', 'B']);
        expect(screen.getByText('更多')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).not.toContainElement(screen.getByText('更多'));
        unmount();

        setup({ more: { count: 2, dropdownProps: { trigger: 'click' } }, onChange });
        expect(tabNames()).toEqual(['A']);
        await click(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items.map(textOf)).toEqual(['B', 'C']);
        await click(items[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
    });

    it('dropdownProps 的 class 落在下拉弹层上', async () => {
        setup({ more: { count: 2, dropdownProps: { trigger: 'click', class: 'more-pop' } } });
        await click(screen.getByText('更多'));
        const item = (await screen.findAllByRole('menuitemcheckbox'))[0];
        expect(item.closest('.more-pop')).not.toBeNull();
    });

    it('默认触发器是 button，Tab 聚焦，Enter 打开', async () => {
        setup({ more: 2 });
        const trigger = screen.getByRole('button', { name: '更多' });
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.tab();
        await userEvent.tab();
        expect(trigger).toHaveFocus();
        await press('{Enter}');
        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(2);
        await vi.waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });

    it('moreTrigger 替换触发器，moreContent 替换菜单内容，参数为收进菜单的标签', async () => {
        setup({ more: { count: 2, dropdownProps: { trigger: 'click' } } }, threePanes, { snippets: ['more-trigger', 'more-content'] });
        expect(screen.queryByText('更多')).toBeNull();
        await click(screen.getByText('custom more'));
        await vi.waitFor(() => expect(document.querySelector('.custom-menu')).toHaveTextContent('BC'));
        expect(screen.queryAllByRole('menuitemcheckbox')).toHaveLength(0);
    });

    it('more 的格式错误时抛出异常', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => setup({ more: 'many' as unknown as number })).toThrow('[Semi Tabs]: invalid tab props format: more');
    });

    it('more：菜单中的禁用标签不能被点选', async () => {
        const onChange = vi.fn<(activeKey: string) => void>();
        setup({ more: 2, onChange }, [...threePanes.slice(0, 2), { ...threePanes[2], disabled: true }]);
        await userEvent.hover(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });

    it('选中的标签收进菜单时，第一个可用标签是唯一的 Tab 停靠点，面板仍以该标签命名', () => {
        const { unmount } = setup({ more: 2, activeKey: 'c' });
        expect(tabStops().map(textOf)).toEqual(['A']);
        expect(screen.getByRole('tabpanel', { name: 'C' })).toBeInTheDocument();
        unmount();

        const second = setup({ more: 1, activeKey: 'c' }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]);
        expect(tabStops().map(textOf)).toEqual(['B']);
        second.unmount();

        setup({ more: 1, activeKey: 'b' });
        expect(tabStops().map(textOf)).toEqual(['B']);
    });

    it('count 为 0 的对象与 more=0 一样不渲染「更多」触发器', () => {
        setup({ more: { count: 0 } });
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        expect(screen.queryByRole('button', { name: zh_CN.Tabs.more })).toBeNull();
    });
});

describe('Tabs collapsible', () => {
    it('隐藏的标签进入箭头下拉菜单，选中后滚动到可见区域', async () => {
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        const onVisibleTabsChange = vi.fn<(visibleState: Map<string, boolean>) => void>();
        const onChange = vi.fn<(activeKey: string) => void>();
        const panes = keyPanes(['k0', 'k1', 'k2', 'k3', 'k4']);
        setup({ collapsible: true, onVisibleTabsChange, onChange, visibleTabsStyle: 'color: red', dropdownProps: { end: { trigger: 'click' } } }, panes);
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
        expect(screen.getByRole('tablist')).toBe(wrapper);
        expect(screen.getByRole('tablist')).not.toContainElement(arrow('start'));
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(panes.map((pane) => `${pane.itemKey}-bar`));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeDisabled();

        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect([...(onVisibleTabsChange.mock.lastCall?.[0] ?? [])]).toEqual(panes.map((pane, i) => [pane.itemKey, i < 2]));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeEnabled();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k0'));
        expect(scrollIntoView.mock.lastCall?.[0]).toEqual({ behavior: 'auto', block: 'nearest', inline: 'nearest', container: 'nearest' });

        await click(arrowButton('end'));
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k2'));
        expect(scrollIntoView.mock.lastCall?.[0]).toEqual({ behavior: 'smooth', block: 'nearest', inline: 'nearest', container: 'nearest' });
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items.map(textOf)).toEqual(['tab-k2', 'tab-k3', 'tab-k4']);

        const calls = scrollIntoView.mock.calls.length;
        await click(items[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith('k3');
        expect(selectedTab()).toBe('tab-k3');
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k3'));
        expect(scrollIntoView.mock.calls.length).toBe(calls + 1);
    });

    it('箭头按钮上按 Enter 和 Space 每次滚动一个标签', async () => {
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        setup({ collapsible: true }, keyPanes(['k0', 'k1', 'k2', 'k3', 'k4']));
        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }).focus();
        scrollIntoView.mockClear();
        await press('{Enter}');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
        await press(' ');
        expect(scrollIntoView).toHaveBeenCalledTimes(2);
        expect(scrollIntoView.mock.contexts[1]).toBe(tab('tab-k3'));
    });

    it('两个箭头按钮（无论是否禁用）都有可访问名称，名称随语言包切换', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        const { unmount } = setup({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeDisabled();
        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeEnabled();
        unmount();

        const store = createStore<FixtureStore>({ props: { collapsible: true }, panes: keyPanes(['k0', 'k1']) });
        render(TabsConfig, { props: { store, locale: en_US } });
        flushSync();
        expect(screen.getByRole('button', { name: en_US.Tabs.prevTabs })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: en_US.Tabs.nextTabs })).toBeInTheDocument();
    });

    it('collapsible="auto"：观察到标签栏溢出时折叠', async () => {
        stubIntersectionObserver();
        const ro = mockResizeObserverCore();
        setup({ collapsible: 'auto' });
        const bar = getBar();
        expect(ro.observed()).toContain(bar);
        expect(bar).not.toHaveClass(`${prefix}-bar-collapse`);

        Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 300 });
        Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 100 });
        ro.fire(bar, [{ target: bar }]);
        await settle();
        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
    });

    it('arrow、arrowPosition 和 showRestInDropdown=false', async () => {
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        setup({ collapsible: true, arrowPosition: 'end', showRestInDropdown: false }, keyPanes(['k0', 'k1', 'k2']), { snippets: ['arrow'] });
        await io.intersect({ 'k0-bar': true });
        const list = document.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`) as HTMLElement;
        expect(list.firstElementChild).toHaveClass(`${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(document.querySelector('.custom-start')).toHaveTextContent(/^0$/);
        expect(document.querySelector('.custom-end')).toHaveTextContent(/^2$/);
        await click(document.querySelector(`.custom-end .${prefix}-bar-arrow`) as HTMLElement);
        expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k1'));
    });

    it('受控的 activeKey 变化时滚动使标签可见', async () => {
        const scrollIntoView = scrollSpy();
        stubIntersectionObserver();
        const { store } = setup({ collapsible: true, activeKey: 'k0' }, keyPanes(['k0', 'k1', 'k2']));
        expect(scrollIntoView).not.toHaveBeenCalled();
        store.props.activeKey = 'k2';
        await settle();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
    });

    it('箭头菜单中的禁用标签不能被点选', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        const onChange = vi.fn<(activeKey: string) => void>();
        const panes = keyPanes(['k0', 'k1', 'k2', 'k3']).map((pane) => ({ ...pane, disabled: pane.itemKey === 'k3' }));
        setup({ collapsible: true, onChange }, panes);
        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        await click(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('tab-k0');
    });

    it('带下拉菜单的箭头外层容器不是 Tab 停靠点，箭头按钮既不被描述也不标记为 menu button', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        setup({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        await io.intersect({ 'k0-bar': true });
        const wrapper = arrow('end');
        expect(wrapper.querySelector('button')).toBeEnabled();
        expect(wrapper).toHaveAttribute('tabindex', '-1');
        for (const node of [wrapper, wrapper.querySelector('button') as HTMLElement]) {
            expect(node).not.toHaveAttribute('aria-describedby');
            expect(node).not.toHaveAttribute('aria-haspopup');
            expect(node).not.toHaveAttribute('aria-expanded');
        }
    });

    it('折叠模式下方向键与 Home、End 在整个 tablist 内移动（每个标签有各自的外层元素）', async () => {
        stubIntersectionObserver();
        setup({ collapsible: true }, [...keyPanes(['k0', 'k1', 'k2', 'k3']).slice(0, 1), { itemKey: 'k1', tab: 'tab-k1', disabled: true }, { itemKey: 'k2', tab: 'tab-k2' }, { itemKey: 'k3', tab: 'tab-k3' }]);
        tab('tab-k0').focus();
        await press('{ArrowRight}');
        expect(tab('tab-k2')).toHaveFocus();
        await press('{End}');
        expect(tab('tab-k3')).toHaveFocus();
        await press('{ArrowRight}');
        expect(tab('tab-k0')).toHaveFocus();
        await press('{Home}');
        expect(tab('tab-k0')).toHaveFocus();
    });
});
