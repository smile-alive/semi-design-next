/** @jsxImportSource vue */
import { KeepAlive, createApp, createSSRApp, defineComponent, h, nextTick, reactive, ref, shallowReactive, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserver, render } from '@test/utils/vue';
import Tabs, { TabItem, TabPane, type PlainTab, type TabBarProps, type TabPaneProps, type TabsArrowSlotProps, type TabsDropdownItemProps, type TabsEmits, type TabsMoreContentSlotProps, type TabsProps, type TabsTabBarSlotProps, type TabsTabSlotProps } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Closable from './fixtures/closable.vue';
import Collect from './fixtures/collect.vue';
import Model from './fixtures/model.vue';
import Panes from './fixtures/panes.vue';

// jsdom has no layout, so these tests assert the native scrollIntoView path; the fallback is covered by supports.test.ts
vi.mock('@fibrae/semi-foundation/utils/supports', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@fibrae/semi-foundation/utils/supports')>()),
    scrollIntoViewWithin: (el: Element, _scroller: HTMLElement, options: ScrollIntoViewOptions) => el.scrollIntoView({ ...options, container: 'nearest' } as ScrollIntoViewOptions),
}));

const prefix = `${BASE_CLASS_PREFIX}-tabs`;

interface Pane {
    itemKey: string;
    tab: string;
    content?: string;
    disabled?: boolean;
    closable?: boolean;
}

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

const paneNodes = (panes: Pane[]): VNode[] =>
    panes.map(({ itemKey, tab, content, ...rest }) => (
        <TabPane key={itemKey} itemKey={itemKey} {...rest}>
            {{ default: () => content, tab: () => tab }}
        </TabPane>
    ));

function mountTabs(props: Record<string, unknown> = {}, panes: Pane[] = threePanes, slots: Record<string, unknown> = {}) {
    const state = shallowReactive({ props, panes });
    const result = render(defineComponent(() => () => <Tabs {...state.props}>{{ default: () => paneNodes(state.panes), ...slots }}</Tabs>));
    return {
        ...result,
        unmount: () => result.unmount(),
        update: async (next: { props?: Record<string, unknown>; panes?: Pane[] }) => {
            Object.assign(state, next);
            await nextTick();
        },
    };
}

const tab = (name: string) => screen.getByRole('tab', { name });
const tabNames = () => screen.getAllByRole('tab').map((t) => t.textContent);
const selectedTab = () => screen.queryByRole('tab', { selected: true })?.textContent ?? null;
const getBar = () => document.querySelector(`.${prefix}-bar`) as HTMLElement;
const getRoot = () => document.querySelector(`.${prefix}`) as HTMLElement;
const getContent = () => document.querySelector(`.${prefix}-content`) as HTMLElement;
const paneOf = (itemKey: string) => document.querySelector(`[role="tabpanel"][id$="-panel-${itemKey}"]`) as HTMLElement;
const overlayClass = (itemKey: string) => (paneOf(itemKey).querySelector(`.${prefix}-pane-motion-overlay`) as HTMLElement).className;
const closeButtons = () => screen.queryAllByRole('button', { name: zh_CN.Tabs.close });

const changeSpy = () => vi.fn<(activeKey: string) => void>();
const tabClickSpy = () => vi.fn<(activeKey: string, event: MouseEvent | KeyboardEvent) => void>();
const tabCloseSpy = () => vi.fn<(tabKey: string) => void>();

interface StubObserver {
    callback: (entries: unknown[]) => void;
    elements: Set<Element>;
}

function stubIntersectionObserver() {
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
            live().forEach((observer) =>
                observer.callback(
                    [...observer.elements].map((target) => ({
                        target,
                        isIntersecting: Boolean(visibility[(target as HTMLElement).dataset.scrollkey ?? '']),
                        boundingClientRect: { y: 0 },
                    }))
                )
            );
            await nextTick();
            await nextTick();
        },
    };
}

const scrollSpy = () => vi.spyOn(Element.prototype, 'scrollIntoView');

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Tabs', () => {
    it('基础渲染 tabs', () => {
        mountTabs({}, twoPanes);
        expect(getContent().children).toHaveLength(2);
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-tab-active`)).toHaveTextContent(/^titleA$/);
        expect(tab('titleA')).toHaveAttribute('aria-selected', 'true');
    });

    it('Tabs 带自定义 class、style 和 contentStyle', () => {
        mountTabs({ class: 'test', style: { color: 'red' }, contentStyle: { color: 'blue' } }, twoPanes);
        expect(getRoot()).toHaveClass('test', prefix);
        expect(getRoot()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getContent()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('Tabs 带 defaultActiveKey', () => {
        mountTabs({ defaultActiveKey: 'itemKeyB' }, twoPanes);
        expect(selectedTab()).toBe('titleB');
    });

    it('不同类型的 Tabs', () => {
        const typeOf = (type: string) => {
            const { unmount } = mountTabs({ type }, twoPanes);
            const result = {
                button: getBar().classList.contains(`${prefix}-bar-button`),
                card: getBar().classList.contains(`${prefix}-bar-card`),
            };
            unmount();
            return result;
        };
        expect(typeOf('line')).toEqual({ button: false, card: false });
        expect(typeOf('card')).toEqual({ button: false, card: true });
        expect(typeOf('button')).toEqual({ button: true, card: false });
    });

    it('tabList', () => {
        const tabList = [
            { tab: '文档', itemKey: '1' },
            { tab: '快速起步', itemKey: '2' },
            { tab: '帮助', itemKey: '3' },
        ];
        render(Tabs, { props: { tabList }, slots: { default: () => <div>文档</div> } });
        expect(getContent().children).toHaveLength(1);
        expect(getContent()).toHaveTextContent(/^文档$/);
        expect(tabNames()).toEqual(['文档', '快速起步', '帮助']);
    });

    it('点击禁用的面板时不切换', async () => {
        const onChange = changeSpy();
        mountTabs({ defaultActiveKey: 'itemKeyA', onChange }, [twoPanes[0], { ...twoPanes[1], disabled: true }]);
        const disabledTabs = document.querySelectorAll(`.${prefix}-tab-disabled`);
        expect(disabledTabs).toHaveLength(1);
        expect(disabledTabs[0]).toHaveTextContent(/^titleB$/);
        await userEvent.click(tab('titleB'));
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('titleA');
    });

    it('tabClick 事件', async () => {
        const onTabClick = tabClickSpy();
        mountTabs({ onTabClick }, twoPanes);
        await userEvent.click(tab('titleB'));
        expect(onTabClick).toHaveBeenCalledTimes(1);
        expect(onTabClick.mock.calls[0][0]).toBe('itemKeyB');
    });

    it('change 与 update:activeKey 事件', async () => {
        const onChange = changeSpy();
        const onUpdate = changeSpy();
        mountTabs({ onChange, 'onUpdate:activeKey': onUpdate }, twoPanes);
        await userEvent.click(tab('titleB'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('itemKeyB');
        expect(onUpdate).toHaveBeenCalledExactlyOnceWith('itemKeyB');
        expect(selectedTab()).toBe('titleB');
    });

    it('activeKey 变化时更新', async () => {
        const { update } = mountTabs({ activeKey: 'itemKeyA' }, twoPanes);
        expect(selectedTab()).toBe('titleA');
        await update({ props: { activeKey: 'itemKeyB' } });
        expect(selectedTab()).toBe('titleB');
    });

    it('tabList 从空数组变为非空后，非受控的 Tabs 选中第一个可用页签', async () => {
        const view = render(Tabs, { props: { tabList: [] } });
        await view.rerender({
            tabList: [
                { itemKey: 'a', tab: '甲', disabled: true },
                { itemKey: 'b', tab: '乙' },
            ],
        });
        expect(tab('乙')).toHaveAttribute('aria-selected', 'true');
        expect(tab('甲')).toHaveAttribute('aria-selected', 'false');
    });

    it('类型：TabBarProps 只有数据，PlainTab 只有数据字段', () => {
        expectTypeOf<TabBarProps>().not.toHaveProperty('onTabClick');
        expectTypeOf<TabBarProps>().not.toHaveProperty('deleteTabItem');
        expectTypeOf<TabBarProps>().not.toHaveProperty('handleKeyDown');
        expectTypeOf<TabBarProps>().not.toHaveProperty('closable');
        expectTypeOf<PlainTab>().not.toHaveProperty('icon');
        expectTypeOf<PlainTab['tab']>().toEqualTypeOf<string | number | undefined>();
    });

    it('tabpane 的 closable', async () => {
        render(Closable);
        const closeSelector = `.${prefix}-tab-icon-close`;
        const [firstTab, secondTab, thirdTab] = screen.getAllByRole('tab');
        expect(firstTab.querySelector(closeSelector)).not.toBeNull();
        expect(secondTab.querySelector(closeSelector)).not.toBeNull();
        expect(thirdTab.querySelector(closeSelector)).toBeNull();

        await userEvent.click(closeButtons()[0]);
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);
        expect(tabs[0]).toHaveClass(`${prefix}-tab-active`);
        expect(tabs[0]).toHaveTextContent(/^快速起步$/);
    });

    it('tabbar 首次渲染正确', () => {
        mountTabs({}, twoPanes);
        expect(screen.getByRole('tablist')).toHaveTextContent(/^titleAtitleB$/);
    });

    it('两个 Tabs 共用 itemKey 时，各面板由各自的标签标识', () => {
        render(
            defineComponent(() => () => (
                <>
                    <Tabs defaultActiveKey="k">{() => paneNodes([{ itemKey: 'k', tab: 'first', content: 'one' }])}</Tabs>
                    <Tabs defaultActiveKey="k">{() => paneNodes([{ itemKey: 'k', tab: 'second', content: 'two' }])}</Tabs>
                </>
            ))
        );
        const [firstPanel, secondPanel] = screen.getAllByRole('tabpanel');
        expect(firstPanel).toHaveAccessibleName('first');
        expect(secondPanel).toHaveAccessibleName('second');
        const [firstTab, secondTab] = screen.getAllByRole('tab');
        expect(firstTab.getAttribute('aria-controls')).toBe(firstPanel.id);
        expect(secondTab.getAttribute('aria-controls')).toBe(secondPanel.id);
    });

    it('使用 tabList 时，内容区域为所选标签控制的面板', () => {
        render(Tabs, {
            props: {
                defaultActiveKey: '2',
                tabList: [
                    { tab: 'Document', itemKey: '1' },
                    { tab: 'Help', itemKey: '2' },
                ],
            },
            slots: { default: () => <div>content</div> },
        });
        const panel = screen.getByRole('tabpanel');
        expect(screen.getByRole('tab', { selected: true }).getAttribute('aria-controls')).toBe(panel.id);
        expect(panel).toHaveAccessibleName('Help');
        expect(panel).toHaveTextContent('content');
    });

    it('#tabBar 里的 TabItem 控制其所在 Tabs 的面板', () => {
        mountTabs({ defaultActiveKey: 'itemKeyA' }, [{ itemKey: 'itemKeyA', tab: 'custom', content: 'content' }], {
            tabBar: ({ tabBarProps }: TabsTabBarSlotProps) => (
                <div role="tablist">
                    {tabBarProps.list.map((item) => (
                        <TabItem key={item.itemKey} itemKey={item.itemKey} selected={item.itemKey === tabBarProps.activeKey}>
                            {{ tab: () => item.tab }}
                        </TabItem>
                    ))}
                </div>
            ),
        });
        expect(screen.getByRole('tabpanel')).toHaveAccessibleName('custom');
    });

    it('#tabBar 里的 TabItem 点击选中非受控 Tabs 的标签，change 只发出一次', async () => {
        const onChange = changeSpy();
        mountTabs({ onChange }, threePanes, {
            tabBar: ({ tabBarProps }: TabsTabBarSlotProps) => (
                <div role="tablist">
                    {tabBarProps.list.map((item) => (
                        <TabItem key={item.itemKey} itemKey={item.itemKey} selected={item.itemKey === tabBarProps.activeKey}>
                            {{ tab: () => item.tab }}
                        </TabItem>
                    ))}
                </div>
            ),
        });
        expect(selectedTab()).toBe('A');
        await userEvent.click(tab('B'));
        expect(selectedTab()).toBe('B');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
    });

    it('TabPane 的 id、role 不被透传属性覆盖，tabindex 可覆盖，class 和 style 合并', () => {
        render(
            defineComponent(() => () => (
                <Tabs>
                    {() => (
                        <TabPane itemKey="a" id="own" role="region" tabindex={-1} class="x" style={{ color: 'red' }}>
                            {{ default: () => 'content', tab: () => 'A' }}
                        </TabPane>
                    )}
                </Tabs>
            ))
        );
        const panel = screen.getByRole('tabpanel');
        expect(panel.id).toMatch(/-panel-a$/);
        expect(panel).toHaveAttribute('role', 'tabpanel');
        expect(panel).toHaveAttribute('tabindex', '-1');
        expect(panel).toHaveClass('x', `${prefix}-pane`);
        expect(panel).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(panel.getAttribute('aria-labelledby')).toBe(tab('A').id);
    });

    it('dropdownProps 的 class 和 style 类型可写，并落在下拉弹层上', async () => {
        expectTypeOf<TabsDropdownItemProps>().toHaveProperty('class');
        expectTypeOf<TabsDropdownItemProps>().toHaveProperty('style');
        mountTabs({
            more: { count: 2, dropdownProps: { trigger: 'click', class: 'more-pop' } satisfies TabsDropdownItemProps },
        });
        await userEvent.click(screen.getByText('更多'));
        const item = (await screen.findAllByRole('menuitemcheckbox'))[0];
        expect(item.closest('.more-pop')).not.toBeNull();
    });
});

describe('Tabs 行为', () => {
    it('tabClick 接收 key 和事件；点击已选中的标签不发出 change', async () => {
        const onTabClick = tabClickSpy();
        const onChange = changeSpy();
        mountTabs({ onTabClick, onChange });
        await userEvent.click(tab('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(onTabClick).toHaveBeenCalledTimes(1);
        expect(onTabClick.mock.lastCall?.[0]).toBe('a');
        expect(onTabClick.mock.lastCall?.[1]).toMatchObject({ type: 'click' });
        await userEvent.click(tab('C'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
        expect(onTabClick.mock.lastCall?.[0]).toBe('c');
    });

    it('键盘激活时 tabClick 收到 keydown 事件，类型为鼠标与键盘事件的联合', async () => {
        const onTabClick = tabClickSpy();
        mountTabs({ onTabClick });
        tab('B').focus();
        await userEvent.keyboard('{Enter}');
        expect(onTabClick).toHaveBeenCalledExactlyOnceWith('b', expect.objectContaining({ type: 'keydown' }));
        expectTypeOf<TabsEmits['tabClick'][1]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
    });

    it('受控时点击只报告 key；移除 activeKey 后从最后的受控 key 继续', async () => {
        const onChange = changeSpy();
        const { update } = mountTabs({ activeKey: 'a', onChange });
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('A');
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledTimes(2);

        await update({ props: { activeKey: 'c', onChange } });
        expect(selectedTab()).toBe('C');
        await update({ props: { onChange } });
        expect(selectedTab()).toBe('C');
        await userEvent.click(tab('A'));
        expect(onChange).toHaveBeenLastCalledWith('a');
        expect(selectedTab()).toBe('A');
    });

    it('单向绑定：父级以同一个值重渲染时仍以受控值为准', async () => {
        const onChange = changeSpy();
        const { update } = mountTabs({ activeKey: 'a', onChange });
        await userEvent.click(tab('B'));
        expect(selectedTab()).toBe('A');
        await update({ props: { activeKey: 'a', onChange, class: 'again' } });
        expect(selectedTab()).toBe('A');
    });

    it('v-model:activeKey 双向绑定', async () => {
        render(Model);
        await userEvent.click(tab('B'));
        expect(screen.getByTestId('key')).toHaveTextContent('b');
        expect(selectedTab()).toBe('B');
    });

    it('activeKey 为 undefined 时按非受控处理：取 defaultActiveKey，点击即切换', async () => {
        const onChange = changeSpy();
        mountTabs({ activeKey: undefined, defaultActiveKey: 'b', onChange });
        expect(selectedTab()).toBe('B');
        await userEvent.click(tab('C'));
        expect(selectedTab()).toBe('C');
    });

    it('activeKey 为 null 时不选中任何标签，也不抛错，点击仍只报告 key', async () => {
        const onChange = changeSpy();
        mountTabs({ activeKey: null, onChange });
        expect(selectedTab()).toBeNull();
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledWith('b');
        expect(selectedTab()).toBeNull();
    });

    it('keepDOM=false 时只渲染所选面板', async () => {
        mountTabs({ keepDOM: false });
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content a$/);
        await userEvent.click(tab('C'));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content c$/);
    });

    it('keepDOM=false 且只有一个 TabPane 时，未选中也不渲染它', () => {
        mountTabs({ keepDOM: false, activeKey: null }, [threePanes[0]]);
        expect(screen.queryAllByRole('tabpanel', { hidden: true })).toHaveLength(0);
    });

    it('lazyRender 在面板首次激活时渲染，之后保留', async () => {
        mountTabs({ lazyRender: true });
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
        const { unmount } = mountTabs();
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
        expect(getRoot()).toHaveClass(prefix, `${prefix}-top`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`, `${prefix}-tab-top`, `${prefix}-tab-single`);
        unmount();

        mountTabs({ tabPosition: 'left', size: 'small', type: 'card' });
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
        expect(getBar()).toHaveClass(`${prefix}-bar`, `${prefix}-bar-card`, `${prefix}-bar-left`);
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect(getContent()).toHaveClass(`${prefix}-content-left`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-card`, `${prefix}-tab-left`, `${prefix}-tab-small`);
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-medium`);
    });

    it('roving tabindex，以及标签与面板之间的 aria 关联', () => {
        mountTabs(
            {},
            threePanes.map((pane) => (pane.itemKey === 'b' ? { ...pane, disabled: true } : pane))
        );
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
        const view = render(Tabs, {
            props: { tabList: threePanes.map(({ itemKey, tab: name }) => ({ itemKey, tab: name })) },
            slots: { default: () => 'content' },
        });
        const panel = screen.getByRole('tabpanel');
        expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-controls'))).toEqual([panel.id, null, null]);
        view.unmount();

        mountTabs({ keepDOM: false });
        const pane = screen.getByRole('tabpanel');
        expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-controls'))).toEqual([pane.id, null, null]);
    });

    it('键盘：方向键跳过禁用标签并循环移动，Home 和 End 跳转，Enter 选择', async () => {
        const onChange = changeSpy();
        const panes = [...threePanes, { itemKey: 'd', tab: 'D', disabled: true }, { itemKey: 'e', tab: 'E' }];
        mountTabs(
            { onChange },
            panes.map((p) => (p.itemKey === 'c' ? { ...p, disabled: true } : p))
        );
        tab('B').focus();
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
        tab('A').focus();
        await userEvent.keyboard(' ');
        expect(selectedTab()).toBe('A');
    });

    it('键盘：RTL 页面中，水平标签栏的左右方向键互换', async () => {
        render(defineComponent(() => () => <ConfigProvider direction="rtl">{() => <Tabs>{() => paneNodes(threePanes)}</Tabs>}</ConfigProvider>));
        tab('A').focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(tab('C')).toHaveFocus();
    });

    it('键盘：垂直标签栏使用上下方向键', async () => {
        mountTabs({ tabPosition: 'left' });
        tab('A').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('A')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        expect(tab('C')).toHaveFocus();
    });

    it('closable：关闭图标和 Backspace 发出 tabClose，而非 tabClick', async () => {
        const onTabClose = tabCloseSpy();
        const onTabClick = tabClickSpy();
        mountTabs(
            { onTabClose, onTabClick },
            threePanes.map((p) => ({ ...p, closable: p.itemKey !== 'c' }))
        );
        expect(closeButtons()).toHaveLength(2);
        await userEvent.click(closeButtons()[1]);
        expect(onTabClose).toHaveBeenCalledExactlyOnceWith('b');
        expect(onTabClick).not.toHaveBeenCalled();

        tab('A').focus();
        await userEvent.keyboard('{Backspace}');
        expect(onTabClose).toHaveBeenLastCalledWith('a');
        expect(tab('B')).toHaveFocus();
        tab('C').focus();
        await userEvent.keyboard('{Delete}');
        expect(onTabClose).toHaveBeenCalledTimes(2);
    });

    it('closable：禁用页签的关闭图标照常显示，点击不关闭', async () => {
        const onTabClose = tabCloseSpy();
        const onTabClick = tabClickSpy();
        mountTabs({ onTabClose, onTabClick }, [threePanes[0], { ...threePanes[1], disabled: true, closable: true }]);
        expect(closeButtons()).toHaveLength(1);
        await userEvent.click(closeButtons()[0]);
        expect(onTabClose).not.toHaveBeenCalled();
        expect(onTabClick).not.toHaveBeenCalled();
    });

    it.each(['Delete', 'Backspace'])('closable：禁用页签聚焦后按 %s 不关闭', async (key) => {
        const onTabClose = tabCloseSpy();
        mountTabs({ onTabClose }, [threePanes[0], { ...threePanes[1], disabled: true, closable: true }]);
        screen.getByRole('tab', { name: 'B' }).focus();
        await userEvent.keyboard(`{${key}}`);
        expect(onTabClose).not.toHaveBeenCalled();
    });

    it('#tabBarExtraContent 位于标签栏中 tablist 之外，浮动到行尾并保留自身样式', () => {
        mountTabs({}, threePanes, {
            tabBarExtraContent: () => <button style={{ color: 'red' }}>Extra</button>,
        });
        const extra = document.querySelector(`.${prefix}-bar-extra`) as HTMLElement;
        expect(getBar()).toContainElement(extra);
        expect(screen.getByRole('tablist')).not.toContainElement(extra);
        expect(extra).toHaveAttribute('x-semi-prop', 'tabBarExtraContent');
        expect(extra).toHaveClass(`${prefix}-bar-line-extra`, `${prefix}-bar-line-extra-large`);
        expect(extra).toHaveStyle({ float: 'inline-end' });
        expect(extra.style.color).toBe('');
        expect(screen.getByRole('button', { name: 'Extra' })).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('空的 #tabBarExtraContent 不渲染容器', () => {
        mountTabs({}, threePanes, { tabBarExtraContent: () => [] });
        expect(document.querySelector(`.${prefix}-bar-extra`)).toBeNull();
    });

    it('标签内控件的按键不触发标签的键盘操作', async () => {
        const onTabClose = tabCloseSpy();
        const onTabClick = tabClickSpy();
        render(
            defineComponent(() => () => (
                <Tabs onTabClose={onTabClose} onTabClick={onTabClick}>
                    {() => [
                        <TabPane itemKey="a" closable>
                            {{
                                default: () => 'content a',
                                tab: () => <input aria-label="name" />,
                            }}
                        </TabPane>,
                        ...paneNodes(threePanes.slice(1)),
                    ]}
                </Tabs>
            ))
        );
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

    it('#tabBarExtraContent 元素的 float 由外层继承', () => {
        mountTabs({}, threePanes, { tabBarExtraContent: () => <button style={{ float: 'left' }}>Extra</button> });
        expect(document.querySelector(`.${prefix}-bar-extra`)).toHaveStyle({ float: 'left' });
    });

    it('#tabBar 接收只含数据的标签栏属性和默认标签栏节点', async () => {
        const onChange = changeSpy();
        const tabBar = vi.fn<(props: TabsTabBarSlotProps) => VNode>(({ tabBar: bar }) => <div class="wrap">{h(bar, { 'data-bar': 'custom' })}</div>);
        mountTabs({ onChange, tabBarClassName: 'bar', tabBarStyle: { color: 'red' } }, threePanes, { tabBar });
        expect(tabBar.mock.lastCall?.[0].tabBarProps).toMatchObject({
            activeKey: 'a',
            class: 'bar',
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
        for (const item of tabBar.mock.lastCall?.[0].tabBarProps.list ?? []) {
            expect(Object.values(item).some((value) => typeof value === 'function')).toBe(false);
        }
        const bar = document.querySelector(`.wrap .${prefix}-bar`);
        expect(bar).toHaveClass('bar');
        expect(bar).toHaveAttribute('data-bar', 'custom');
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(tabBar.mock.lastCall?.[0].tabBarProps.activeKey).toBe('b');
    });

    it('data-* 属性传到根节点和面板', () => {
        render(
            defineComponent(() => () => (
                <Tabs data-testid="tabs">
                    {() => (
                        <TabPane data-pane="a" itemKey="a">
                            {{ default: () => 'a', tab: () => 'A' }}
                        </TabPane>
                    )}
                </Tabs>
            ))
        );
        expect(getRoot()).toHaveAttribute('data-testid', 'tabs');
        expect(screen.getByRole('tabpanel')).toHaveAttribute('data-pane', 'a');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', async () => {
        semiGlobal.config.overrideDefaultProps = { Tabs: { type: 'card', size: 'small' } };
        const { unmount } = mountTabs();
        expect(getBar()).toHaveClass(`${prefix}-bar-card`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-small`);
        unmount();
        mountTabs({ type: 'button' });
        expect(getBar()).toHaveClass(`${prefix}-bar-button`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-small`);
    });

    it('全局默认值 collapsible 生效，Tabs 外的 TabItem 不受 Tabs 全局值影响', () => {
        semiGlobal.config.overrideDefaultProps = { Tabs: { collapsible: true, type: 'card', size: 'small' } };
        const { unmount } = mountTabs({}, keyPanes(['k0', 'k1', 'k2']));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeInTheDocument();
        unmount();

        render(TabItem, { props: { itemKey: 'a' }, slots: { tab: () => 'A' } });
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-card`);
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-small`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`);
    });

    it('通过 semiGlobalKey 注入的实例只作用于该应用', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Tabs: { tabPosition: 'left', keepDOM: false } };
        render(Tabs, {
            slots: { default: () => paneNodes(threePanes) },
            global: { provide: { [semiGlobalKey]: semi } },
        });
        expect(getRoot()).toHaveClass(`${prefix}-left`);
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(semiGlobal.config.overrideDefaultProps).toEqual({});
    });

    it('点击后所选面板播放滑入动画，每次点击只发出一次 change', async () => {
        const onChange = changeSpy();
        mountTabs({ onChange });
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('B');
        expect(overlayClass('b')).toContain(`${prefix}-pane-animate-leftShow`);
    });

    it('more：最后的标签收进下拉菜单，可按数量或对象配置', async () => {
        const onChange = changeSpy();
        const { unmount } = mountTabs({ more: 1, onChange });
        expect(tabNames()).toEqual(['A', 'B']);
        expect(screen.getByText('更多')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).not.toContainElement(screen.getByText('更多'));
        unmount();

        mountTabs({ more: { count: 2, dropdownProps: { trigger: 'click' } }, onChange });
        expect(tabNames()).toEqual(['A']);
        await userEvent.click(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items.map((item) => item.textContent)).toEqual(['B', 'C']);
        await userEvent.click(items[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
    });

    it('more：默认触发器是 button，Tab 聚焦，Enter 打开', async () => {
        mountTabs({ more: 2 });
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
        mountTabs({ more: 2 });
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.keyboard(' ');
        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(2);
    });

    it('more：#more 替换触发器，错误的格式会抛出异常', () => {
        const { unmount } = mountTabs({ more: { count: 5 } }, threePanes, { more: () => <span>custom more</span> });
        expect(screen.getByText('custom more')).toBeInTheDocument();
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        unmount();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        // Testing Library rethrows a mount error and leaves its container in the document, so mount a detached app
        const errorHandler = vi.fn<(error: unknown) => void>();
        const invalidMore = { more: 'many' } as unknown as TabsProps;
        const app = createApp(() => <Tabs {...invalidMore}>{() => paneNodes(threePanes)}</Tabs>);
        app.config.errorHandler = errorHandler;
        app.mount(document.createElement('div'));
        app.unmount();
        expect(errorHandler.mock.calls[0]?.[0]).toEqual(new Error('[Semi Tabs]: invalid tab props format: more'));
    });

    it('more：#moreContent 替换菜单内容，参数为收进菜单的页签', async () => {
        const moreContent = vi.fn<(props: TabsMoreContentSlotProps) => VNode>(({ items }) => (
            <ul class="custom-menu">
                {items.map((item) => (
                    <li key={item.itemKey}>{item.tab}</li>
                ))}
            </ul>
        ));
        mountTabs({ more: { count: 2, dropdownProps: { trigger: 'click' } } }, threePanes, { moreContent });
        await userEvent.click(screen.getByText('更多'));
        await vi.waitFor(() => expect(document.querySelector('.custom-menu')).toHaveTextContent('BC'));
        expect(moreContent.mock.lastCall?.[0].items).toEqual([
            { itemKey: 'b', tab: 'B', disabled: false, closable: false },
            { itemKey: 'c', tab: 'C', disabled: false, closable: false },
        ]);
        expect(screen.queryAllByRole('menuitemcheckbox')).toHaveLength(0);
    });

    it('collapsible：隐藏的标签进入箭头下拉菜单，选中后滚动到可见区域', async () => {
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        const onVisibleTabsChange = vi.fn<(visibleState: Map<string, boolean>) => void>();
        const onChange = changeSpy();
        const panes = keyPanes(['k0', 'k1', 'k2', 'k3', 'k4']);
        mountTabs(
            {
                collapsible: true,
                onVisibleTabsChange,
                onChange,
                visibleTabsStyle: { color: 'red' },
                dropdownProps: { end: { trigger: 'click' } },
            },
            panes
        );
        const arrow = (pos: string) => document.querySelector(`.${prefix}-bar-arrow-${pos}`) as HTMLElement;
        const arrowButton = (pos: string) => arrow(pos).querySelector('button') as HTMLButtonElement;
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
        expect(screen.getByRole('tablist')).toBe(wrapper);
        expect(screen.getByRole('tablist')).not.toContainElement(arrow('start'));
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(panes.map((p) => `${p.itemKey}-bar`));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeDisabled();

        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect([...(onVisibleTabsChange.mock.lastCall?.[0] ?? [])]).toEqual(panes.map((p, i) => [p.itemKey, i < 2]));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeEnabled();
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k0'));
        expect(scrollIntoView.mock.lastCall?.[0]).toEqual({ behavior: 'auto', block: 'nearest', inline: 'nearest', container: 'nearest' });

        await userEvent.click(arrowButton('end'));
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k2'));
        expect(scrollIntoView.mock.lastCall?.[0]).toEqual({ behavior: 'smooth', block: 'nearest', inline: 'nearest', container: 'nearest' });
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
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        mountTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2', 'k3', 'k4']));
        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        const next = screen.getByRole('button', { name: zh_CN.Tabs.nextTabs });
        next.focus();
        scrollIntoView.mockClear();

        await userEvent.keyboard('{Enter}');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
        await userEvent.keyboard(' ');
        expect(scrollIntoView).toHaveBeenCalledTimes(2);
        expect(scrollIntoView.mock.contexts[1]).toBe(tab('tab-k3'));
    });

    it('collapsible：两个箭头按钮（无论是否禁用）都有可访问名称', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        mountTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeDisabled();
        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeEnabled();
    });

    it('collapsible：箭头名称随语言包切换', () => {
        stubIntersectionObserver();
        render(defineComponent(() => () => <ConfigProvider locale={en_US}>{() => <Tabs collapsible>{() => paneNodes(keyPanes(['k0', 'k1']))}</Tabs>}</ConfigProvider>));
        expect(screen.getByRole('button', { name: en_US.Tabs.prevTabs })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: en_US.Tabs.nextTabs })).toBeInTheDocument();
    });

    it('collapsible="auto"：观察到标签栏溢出时折叠', async () => {
        stubIntersectionObserver();
        const ro = mockResizeObserver();
        mountTabs({ collapsible: 'auto' });
        const bar = getBar();
        expect(ro.observed()).toEqual([bar]);
        expect(bar).not.toHaveClass(`${prefix}-bar-collapse`);

        Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 300 });
        Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 100 });
        await ro.fire(bar, [{ target: bar }]);
        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
    });

    it('collapsible：#arrow、arrowPosition 和 showRestInDropdown=false', async () => {
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        const arrow = vi.fn<(props: TabsArrowSlotProps) => VNode>(({ items, position, defaultNode }) => (
            <span class={`custom-${position}`}>
                {String(items.length)}
                {h(defaultNode)}
            </span>
        ));
        mountTabs({ collapsible: true, arrowPosition: 'end', showRestInDropdown: false }, keyPanes(['k0', 'k1', 'k2']), { arrow });
        await io.intersect({ 'k0-bar': true });
        const list = document.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`) as HTMLElement;
        expect(list.firstElementChild).toHaveClass(`${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(document.querySelector('.custom-start')).toHaveTextContent(/^0$/);
        expect(document.querySelector('.custom-end')).toHaveTextContent(/^2$/);
        expect(arrow.mock.lastCall?.[0].position).toBe('end');
        expect(arrow.mock.lastCall?.[0].items.map((item) => item.itemKey)).toEqual(['k1', 'k2']);
        await userEvent.click(document.querySelector(`.custom-end .${prefix}-bar-arrow`) as HTMLElement);
        expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k1'));
    });

    it('collapsible：#arrow 的 onClick 每次滚动下一个隐藏的标签', async () => {
        const scrollIntoView = scrollSpy();
        const io = stubIntersectionObserver();
        mountTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2', 'k3']), {
            arrow: ({ position, onClick }: TabsArrowSlotProps) => <button type="button" onClick={onClick}>{`scroll-${position}`}</button>,
        });
        await io.intersect({ 'k0-bar': true });
        scrollIntoView.mockClear();
        await userEvent.click(screen.getByRole('button', { name: 'scroll-end' }));
        await userEvent.click(screen.getByRole('button', { name: 'scroll-end' }));
        expect(scrollIntoView.mock.contexts).toEqual([tab('tab-k1'), tab('tab-k2')]);
    });

    it('collapsible：受控的 activeKey 变化时滚动使标签可见', async () => {
        const scrollIntoView = scrollSpy();
        stubIntersectionObserver();
        const { update } = mountTabs({ collapsible: true, activeKey: 'k0' }, keyPanes(['k0', 'k1', 'k2']));
        expect(scrollIntoView).not.toHaveBeenCalled();
        await update({ props: { collapsible: true, activeKey: 'k2' } });
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
    });

    it('collapsible：itemKey 含双引号与空格时切换不抛错，标签与面板的 id 一一对应', async () => {
        const scrollIntoView = scrollSpy();
        stubIntersectionObserver();
        const panes = ['a "b"', 'c d'].map((key) => ({ itemKey: key, tab: `tab-${key}`, content: key }));
        const { update } = mountTabs({ collapsible: true, activeKey: 'a "b"' }, panes);
        await update({ props: { collapsible: true, activeKey: 'c d' } });
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-c d'));
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        screen.getAllByRole('tab').forEach((t, i) => {
            expect(t.id).not.toMatch(/\s/);
            expect(panels[i].id).not.toMatch(/\s/);
            expect(t.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(t.id);
        });
    });

    it('子项变化：新增面板时选中第一个；删除已选中的面板时回退到第一个', async () => {
        const { update } = mountTabs({}, []);
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        await update({ panes: threePanes });
        expect(selectedTab()).toBe('A');
        await update({ panes: threePanes.slice(1) });
        expect(selectedTab()).toBe('B');
    });

    it('子项模式移除当前面板时，回退到第一个启用的面板', async () => {
        const panes = threePanes.map((p) => (p.itemKey === 'a' ? { ...p, disabled: true } : p));
        const { update } = mountTabs({ defaultActiveKey: 'c' }, panes);
        expect(selectedTab()).toBe('C');
        await update({ panes: panes.slice(0, 2) });
        expect(selectedTab()).toBe('B');
    });

    it('非受控时在前面插入面板，选中项不变', async () => {
        const { update } = mountTabs({}, threePanes.slice(1));
        expect(selectedTab()).toBe('B');
        await update({ panes: threePanes });
        expect(selectedTab()).toBe('B');
    });

    it('tabList 模式移除当前 key 后，选中第一个启用的页签', async () => {
        const list = threePanes.map(({ itemKey, tab: name }) => ({ itemKey, tab: name, disabled: itemKey === 'a' }));
        const view = render(Tabs, { props: { defaultActiveKey: 'c', tabList: list } });
        expect(selectedTab()).toBe('C');
        await view.rerender({ defaultActiveKey: 'c', tabList: list.slice(0, 2) });
        expect(tabNames()).toEqual(['A', 'B']);
        expect(selectedTab()).toBe('B');
    });

    it('tabList 只要是数组（含空数组）就优先于子项', () => {
        render(Tabs, {
            props: { tabList: [{ itemKey: 'x', tab: 'X' }] },
            slots: { default: () => paneNodes(threePanes) },
        });
        expect(tabNames()).toEqual(['X']);
    });

    it('defaultActiveKey 不在页签中时不选中任何面板', () => {
        mountTabs({ defaultActiveKey: 'zzz' });
        expect(selectedTab()).toBeNull();
    });

    it('motion：所选面板从上一个标签的一侧滑入', async () => {
        mountTabs();
        const animate = (dir: string) => `${prefix}-pane-animate-${dir}Show`;
        expect(overlayClass('a')).not.toContain('animate');
        await userEvent.click(tab('C'));
        expect(overlayClass('c')).toContain(animate('left'));
        expect(overlayClass('a')).not.toContain('animate');
        await userEvent.click(tab('B'));
        expect(overlayClass('b')).toContain(animate('right'));
    });

    it('motion：垂直标签栏上下滑动，tabPaneMotion=false 时关闭动画', async () => {
        const animate = (dir: string) => `${prefix}-pane-animate-${dir}Show`;
        const { unmount } = mountTabs({ tabPosition: 'left' });
        await userEvent.click(tab('B'));
        expect(overlayClass('b')).toContain(animate('top'));
        await userEvent.click(tab('A'));
        expect(overlayClass('a')).toContain(animate('bottom'));
        unmount();

        mountTabs({ tabPaneMotion: false });
        await userEvent.click(tab('B'));
        expect(overlayClass('b')).not.toContain('animate');
    });

    it('motion：新增并同时选中的面板，或删除所选面板后，不播放动画', async () => {
        const animate = `${prefix}-pane-animate`;
        const two = threePanes.slice(0, 2);
        const { update } = mountTabs({ activeKey: 'a' }, two);
        await update({ props: { activeKey: 'b' } });
        expect(overlayClass('b')).toContain(animate);
        await update({ props: { activeKey: 'c' }, panes: threePanes });
        expect(selectedTab()).toBe('C');
        expect(overlayClass('c')).not.toContain(animate);

        await update({ props: {} });
        await update({ panes: two });
        expect(selectedTab()).toBe('A');
        expect(overlayClass('a')).not.toContain(animate);
    });

    // Vue binds the unprefixed name, and jsdom has no AnimationEvent
    const endAnimation = async (target: Node) => {
        target.dispatchEvent(new Event('animationend', { bubbles: true }));
        await nextTick();
    };
    const overlayOf = (itemKey: string) => paneOf(itemKey).querySelector(`.${prefix}-pane-motion-overlay`) as HTMLElement;

    it('motion：动画结束后去掉面板的方向 class，再次选中时重新播放', async () => {
        const animate = `${prefix}-pane-animate`;
        const { update } = mountTabs({ activeKey: 'a' });
        await update({ props: { activeKey: 'b' } });
        await endAnimation(overlayOf('b'));
        expect(overlayClass('b')).not.toContain(animate);
        await update({ props: { activeKey: 'a' } });
        await update({ props: { activeKey: 'b' } });
        expect(overlayClass('b')).toContain(animate);
    });

    it('motion：面板内容冒泡上来的 animationend 不结束面板动画', async () => {
        const { update } = mountTabs({ activeKey: 'a' });
        await update({ props: { activeKey: 'b' } });
        await endAnimation(overlayOf('b').firstChild as Node);
        expect(overlayClass('b')).toContain(`${prefix}-pane-animate`);
    });

    it('TabItem 组件实例的 $el 是标签元素', () => {
        const itemRef = ref<{ $el: Element }>();
        mountTabs({}, [threePanes[0]], {
            tabBar: () => (
                <TabItem ref={itemRef} itemKey="a" selected>
                    {{ tab: () => 'A' }}
                </TabItem>
            ),
        });
        expect(itemRef.value?.$el).toBe(tab('A'));
    });

    it('TabItem 的 role、tabindex 和 aria 状态优先于透传属性，并合并 class 和 style', () => {
        mountTabs({}, [threePanes[0]], {
            tabBar: () => (
                <TabItem itemKey="a" selected {...{ role: 'button', tabindex: 5, 'aria-selected': 'false', id: 'own', class: 'extra', style: { opacity: 0.5 }, 'data-x': '1' }}>
                    {{ tab: () => 'A' }}
                </TabItem>
            ),
        });
        const el = tab('A');
        expect(el).toHaveAttribute('tabindex', '0');
        expect(el).toHaveAttribute('aria-selected', 'true');
        expect(el.id).not.toBe('own');
        expect(el).toHaveClass('extra', `${prefix}-tab`);
        expect(el).toHaveStyle({ opacity: '0.5' });
        expect(el).toHaveAttribute('data-x', '1');
    });

    it('TabItem 的 click 载荷为 itemKey 与事件，禁用时不发出，使用方的 keydown 先于标签的键盘处理', async () => {
        const onClick = vi.fn<(itemKey: string, event: MouseEvent) => void>();
        const order: string[] = [];
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>(() => order.push('own'));
        const onTabClick = tabClickSpy();
        onTabClick.mockImplementation(() => order.push('tabs'));
        mountTabs({ onTabClick }, threePanes.slice(0, 2), {
            tabBar: () => (
                <div role="tablist">
                    <TabItem itemKey="a" selected onClick={onClick} onKeydown={onKeydown}>
                        {{ tab: () => 'A' }}
                    </TabItem>
                    <TabItem itemKey="b" disabled onClick={onClick}>
                        {{ tab: () => 'B' }}
                    </TabItem>
                </div>
            ),
        });
        await userEvent.click(tab('A'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith('a', expect.objectContaining({ type: 'click' }));
        await userEvent.click(tab('B'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(order).toEqual(['tabs']);
        order.length = 0;
        tab('A').focus();
        await userEvent.keyboard('{Enter}');
        expect(order).toEqual(['own', 'tabs']);
    });

    it('#tabBar 渲染的默认标签栏，其组件实例的 $el 是标签栏，折叠仍正常工作', async () => {
        stubIntersectionObserver();
        const barRef = ref<{ $el: Element }>();
        mountTabs({ collapsible: true }, keyPanes(['k0', 'k1']), {
            tabBar: ({ tabBar }: TabsTabBarSlotProps) => h(tabBar, { ref: barRef }),
        });
        expect(barRef.value?.$el).toBe(getBar());
        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
    });

    it('Tabs 外部的 TabItem 没有悬空的 id 或 aria-controls，类名回落到 line 与 top', async () => {
        render(TabItem, { props: { itemKey: 'a', closable: true }, slots: { tab: () => 'A' } });
        expect(tab('A')).not.toHaveAttribute('id');
        expect(tab('A')).not.toHaveAttribute('aria-controls');
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`, `${prefix}-tab-top`);
        expect(tab('A').className).not.toContain('undefined');
        await userEvent.click(closeButtons()[0]);
        expect(tab('A')).toBeInTheDocument();
    });

    it('组件实例的 $el 是根 div 与面板 div', () => {
        const tabsRef = ref<{ $el: Element }>();
        const paneRef = ref<{ $el: Element }>();
        render(
            defineComponent(() => () => (
                <Tabs ref={tabsRef}>
                    {() => (
                        <TabPane ref={paneRef} itemKey="a">
                            {{ default: () => 'a', tab: () => 'A' }}
                        </TabPane>
                    )}
                </Tabs>
            ))
        );
        expect(tabsRef.value?.$el).toBe(getRoot());
        expect(paneRef.value?.$el).toBe(screen.getByRole('tabpanel'));
    });

    it('TabPane 的 closable 变化时更新其标签', async () => {
        const { update } = mountTabs();
        expect(closeButtons()).toHaveLength(0);
        await update({ panes: threePanes.map((p) => ({ ...p, closable: p.itemKey === 'b' })) });
        expect(closeButtons()).toHaveLength(1);
    });

    it('未知属性不进入 DOM，面板内部的变化不发出 change', async () => {
        const onChange = changeSpy();
        render(
            defineComponent(() => () => (
                <Tabs preventScroll onChange={onChange}>
                    {() => (
                        <TabPane itemKey="a">
                            {{
                                default: () => <input aria-label="field" />,
                                tab: () => 'A',
                                icon: () => <span>i</span>,
                            }}
                        </TabPane>
                    )}
                </Tabs>
            ))
        );
        await userEvent.type(screen.getByRole('textbox', { name: 'field' }), 'x');
        screen.getByRole('textbox', { name: 'field' }).blur();
        expect(onChange).not.toHaveBeenCalled();
        const panel = screen.getByRole('tabpanel');
        for (const name of ['itemkey', 'item-key', 'tab', 'icon', 'closable', 'disabled']) {
            expect(panel).not.toHaveAttribute(name);
        }
        expect(getRoot()).not.toHaveAttribute('preventscroll');
    });

    it('tabList 为空数组时不把子项当作页签，内容区不引用不存在的 tab', () => {
        render(Tabs, { props: { tabList: [] }, slots: { default: () => <div>content</div> } });
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        expect(screen.queryAllByRole('tabpanel')).toHaveLength(0);
        expect(document.querySelector('[aria-labelledby]')).toBeNull();
        expect(getRoot()).toHaveTextContent('content');
    });

    it('tabList 为空数组且子项是字符串时不抛错', () => {
        render(Tabs, { props: { tabList: [] }, slots: { default: () => 'text' } });
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
    });

    it('more：菜单中的禁用页签不能被点选', async () => {
        const onChange = changeSpy();
        mountTabs({ more: 2, onChange }, [...threePanes.slice(0, 2), { ...threePanes[2], disabled: true }]);
        await userEvent.hover(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });

    it('collapsible：箭头菜单中的禁用页签不能被点选', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        const onChange = changeSpy();
        const panes = keyPanes(['k0', 'k1', 'k2', 'k3']).map((p) => ({ ...p, disabled: p.itemKey === 'k3' }));
        mountTabs({ collapsible: true, onChange }, panes);
        await io.intersect({ 'k0-bar': true, 'k1-bar': true });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('tab-k0');
    });

    it('禁用页签聚焦后按 Enter 或 Space 不激活', async () => {
        const onChange = changeSpy();
        mountTabs({ onChange }, [threePanes[0], { ...threePanes[1], disabled: true }]);
        tab('B').focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });
});

describe('Tabs Tab 停靠点', () => {
    it('collapsible：带下拉菜单的箭头外层容器不是 Tab 停靠点', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        mountTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        await io.intersect({ 'k0-bar': true });
        const arrow = document.querySelector(`.${prefix}-bar-arrow-end`) as HTMLElement;
        expect(arrow.querySelector('button')).toBeEnabled();
        expect(arrow).toHaveAttribute('tabindex', '-1');
    });

    it('collapsible：箭头按钮负责滚动，因此悬停下拉菜单既不描述它，也不将其标记为 menu button', async () => {
        scrollSpy();
        const io = stubIntersectionObserver();
        mountTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        await io.intersect({ 'k0-bar': true });
        const arrow = document.querySelector(`.${prefix}-bar-arrow-end`) as HTMLElement;
        for (const node of [arrow, arrow.querySelector('button') as HTMLElement]) {
            expect(node).not.toHaveAttribute('aria-describedby');
            expect(node).not.toHaveAttribute('aria-haspopup');
            expect(node).not.toHaveAttribute('aria-expanded');
        }
    });
});

describe('Tabs（Vue）', () => {
    it('aria-label 与 aria-labelledby 命名 tablist，其余属性仍落在根元素', async () => {
        const { unmount } = mountTabs({ 'aria-label': '文档导航', 'data-x': 'root', id: 'tabs' });
        expect(screen.getByRole('tablist', { name: '文档导航' })).toBeInTheDocument();
        expect(getRoot()).not.toHaveAttribute('aria-label');
        expect(getRoot()).toHaveAttribute('data-x', 'root');
        expect(getRoot()).toHaveAttribute('id', 'tabs');
        unmount();

        stubIntersectionObserver();
        render(
            defineComponent(() => () => (
                <>
                    <h2 id="heading">章节</h2>
                    <Tabs aria-labelledby="heading" collapsible>
                        {() => paneNodes(threePanes)}
                    </Tabs>
                </>
            ))
        );
        expect(screen.getByRole('tablist', { name: '章节' })).toBe(document.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`));
    });

    it('根元素上的原生 click 经属性透传', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        mountTabs({ onClick });
        await userEvent.click(tab('B'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('声明的 change 不接收面板内输入框冒泡的原生 change', async () => {
        const onChange = changeSpy();
        render(
            defineComponent(() => () => (
                <Tabs onChange={onChange}>
                    {() => (
                        <TabPane itemKey="a">
                            {{
                                default: () => <input aria-label="f" />,
                                tab: () => 'A',
                            }}
                        </TabPane>
                    )}
                </Tabs>
            ))
        );
        const input = screen.getByRole('textbox', { name: 'f' });
        await userEvent.type(input, 'x');
        input.dispatchEvent(new Event('change', { bubbles: true }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('tabClose 与 tabClick 只发出一次', async () => {
        const onTabClose = tabCloseSpy();
        const onTabClick = tabClickSpy();
        mountTabs(
            { onTabClose, onTabClick },
            threePanes.map((p) => ({ ...p, closable: true }))
        );
        await userEvent.click(tab('B'));
        expect(onTabClick).toHaveBeenCalledTimes(1);
        await userEvent.click(closeButtons()[2]);
        expect(onTabClose).toHaveBeenCalledExactlyOnceWith('c');
    });

    it('TabPane 的 #tab 与 #icon 渲染在标签中，空 #icon 不渲染图标容器', () => {
        render(
            defineComponent(() => () => (
                <Tabs>
                    {() => (
                        <>
                            <TabPane itemKey="a">
                                {{
                                    tab: () => '文档',
                                    icon: () => <i class="own-icon" />,
                                }}
                            </TabPane>
                            <TabPane itemKey="b">{{ tab: () => '帮助', icon: () => [] }}</TabPane>
                        </>
                    )}
                </Tabs>
            ))
        );
        expect(tab('文档').querySelector(`.${prefix}-bar-icon .own-icon`)).not.toBeNull();
        expect(tab('帮助').querySelector(`.${prefix}-bar-icon`)).toBeNull();
    });

    it('tabList 的 #tab 与 #icon 对每项调用，参数为 { item, index }；未提供 #tab 时渲染文本', () => {
        const tabList = [
            { itemKey: '1', tab: '文档' },
            { itemKey: '2', tab: '帮助' },
        ];
        const tabSlot = vi.fn<(props: TabsTabSlotProps) => VNode>(({ item, index }) => <b>{`${index}:${String(item.tab)}`}</b>);
        const icon = vi.fn<(props: TabsTabSlotProps) => VNode[]>(({ item }) => (item.itemKey === '1' ? [<i class="own-icon" />] : []));
        const view = render(Tabs, { props: { tabList }, slots: { tab: tabSlot, icon } });
        expect(tabNames()).toEqual(['0:文档', '1:帮助']);
        expect(tabSlot.mock.calls.map(([props]) => props)).toContainEqual({ item: tabList[1], index: 1 });
        expect(tab('0:文档').querySelector(`.${prefix}-bar-icon .own-icon`)).not.toBeNull();
        expect(tab('1:帮助').querySelector(`.${prefix}-bar-icon`)).toBeNull();
        view.unmount();

        render(Tabs, { props: { tabList }, slots: { icon } });
        expect(tabNames()).toEqual(['文档', '帮助']);
    });

    it('Tabs 重渲染后，#tab 里输入框的值与焦点保留', async () => {
        const count = ref(0);
        render(
            defineComponent(() => () => (
                <Tabs data-count={count.value}>
                    {() => (
                        <>
                            <TabPane itemKey="a">
                                {{
                                    tab: () => <input aria-label="name" />,
                                }}
                            </TabPane>
                            <TabPane itemKey="b">{{ tab: () => 'B' }}</TabPane>
                        </>
                    )}
                </Tabs>
            ))
        );
        const input = screen.getByRole('textbox', { name: 'name' });
        await userEvent.type(input, 'abc');
        count.value++;
        await nextTick();
        expect(screen.getByRole('textbox', { name: 'name' })).toBe(input);
        expect(input).toHaveValue('abc');
        expect(input).toHaveFocus();
    });

    it('收集子项：模板编译出的 kebab-case 键与布尔简写（"" 值）按声明的属性读取', () => {
        const rawPane = (raw: Record<string, string>, name: string) => <TabPane {...(raw as TabPaneProps)}>{{ tab: () => name }}</TabPane>;
        render(Tabs, {
            slots: {
                default: () => [rawPane({ 'item-key': 'k', closable: '', disabled: '' }, 'K'), rawPane({ 'item-key': 'm' }, 'M')],
            },
        });
        expect(tab('K').id).toMatch(/-tab-k$/);
        expect(tab('K')).toHaveAttribute('aria-disabled', 'true');
        expect(tab('K').querySelector(`.${prefix}-tab-icon-close`)).not.toBeNull();
        expect(selectedTab()).toBe('M');
    });

    it('收集子项：布尔简写、v-for、v-if 与 template；其他子节点作为内容渲染，模板写法无告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const keys = reactive(['x']);
        const view = render(Collect, { props: { keys } });
        expect(tabNames()).toEqual(['烤串', '禁用', '启用', '项 x', '分组 x']);
        keys.push('w');
        await nextTick();
        expect(tabNames()).toEqual(['烤串', '禁用', '启用', '项 x', '项 w', '分组 x', '分组 w']);
        keys.pop();
        await nextTick();
        expect(tab('烤串')).toHaveAttribute('aria-selected', 'true');
        expect(closeButtons()).toHaveLength(1);
        expect(tab('禁用')).toHaveAttribute('aria-disabled', 'true');
        expect(tab('启用')).toHaveAttribute('aria-disabled', 'false');
        expect(screen.queryByRole('tab', { name: '包装' })).toBeNull();
        expect(getContent()).toHaveTextContent('loose div');
        expect(getContent()).toHaveTextContent('loose text');

        await view.rerender({ keys: ['x', 'y'], extra: true });
        expect(tabNames()).toEqual(['烤串', '禁用', '启用', '项 x', '项 y', '分组 x', '分组 y', '额外']);
        await view.rerender({ keys: [], extra: false });
        expect(tabNames()).toEqual(['烤串', '禁用', '启用']);
        expect(warn).not.toHaveBeenCalled();
    });

    it('收集子项：h() 写法增删子项后重新收集，且无告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const { update } = mountTabs({}, threePanes.slice(0, 1));
        expect(tabNames()).toEqual(['A']);
        await update({ panes: threePanes });
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        await update({ panes: threePanes.slice(2) });
        expect(tabNames()).toEqual(['C']);
        expect(selectedTab()).toBe('C');
        expect(warn).not.toHaveBeenCalled();
    });

    it('收集子项：切换标签只改内部状态，每次更新只为渲染内容读一次 h() 写的默认插槽', async () => {
        let slotCalls = 0;
        let updates = 0;
        const slots = {
            default: () => {
                slotCalls += 1;
                return paneNodes(threePanes);
            },
        };
        render(defineComponent(() => () => <Tabs onVnodeUpdated={() => (updates += 1)}>{slots}</Tabs>));
        slotCalls = 0;
        await userEvent.click(tab('B'));
        expect(selectedTab()).toBe('B');
        expect(updates).toBeGreaterThan(0);
        expect(slotCalls).toBe(updates);
    });

    it('模板写法：v-model 与 fixture 透传的监听', async () => {
        const onChange = changeSpy();
        render(Panes, { props: { panes: threePanes, onChange } });
        await userEvent.click(tab('C'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
        expect(selectedTab()).toBe('C');
    });

    it('服务端渲染时首个启用面板或 defaultActiveKey 为选中项', async () => {
        const selectedInHtml = async (props: { panes: Pane[]; defaultActiveKey?: string }) => {
            const host = document.createElement('div');
            host.innerHTML = await renderToString(createSSRApp({ render: () => <Panes {...props} /> }));
            return host.querySelector('[role="tab"][aria-selected="true"]')?.textContent;
        };
        expect(await selectedInHtml({ panes: [{ ...threePanes[0], disabled: true }, ...threePanes.slice(1)] })).toBe('B');
        expect(await selectedInHtml({ panes: threePanes, defaultActiveKey: 'c' })).toBe('C');
    });

    it('KeepAlive 切走再切回后保留选中项', async () => {
        const show = ref(true);
        render(defineComponent(() => () => <KeepAlive>{() => (show.value ? <Tabs>{() => paneNodes(threePanes)}</Tabs> : <div>other</div>)}</KeepAlive>));
        await userEvent.click(tab('B'));
        show.value = false;
        await nextTick();
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        show.value = true;
        await nextTick();
        expect(selectedTab()).toBe('B');
    });

    const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');

    it('more：选中页签收进菜单时，tablist 内第一个可用页签是唯一的 Tab 停靠点', () => {
        const { unmount } = mountTabs({ more: 2, defaultActiveKey: 'c' });
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
        unmount();

        mountTabs({ more: 1, defaultActiveKey: 'c' }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]);
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
    });

    it('more：选中页签在可见范围内时仍由它停靠', () => {
        mountTabs({ more: 1, defaultActiveKey: 'b' });
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
    });

    it('more：count 为 0 的对象与 more=0 一样不渲染「更多」触发器', () => {
        mountTabs({ more: { count: 0 } });
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        expect(screen.queryByRole('button', { name: zh_CN.Tabs.more })).toBeNull();
    });

    it('键盘：焦点停在禁用页签上时，方向键移到相邻的可用页签', async () => {
        const panes = [...threePanes, { itemKey: 'd', tab: 'D' }, { itemKey: 'e', tab: 'E' }].map((pane) => (pane.itemKey === 'c' ? { ...pane, disabled: true } : pane));
        mountTabs({}, panes);
        tab('C').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('D')).toHaveFocus();
        tab('C').focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
    });
});

describe('Tabs 键盘与命名', () => {
    const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');

    it('activeKey 为 null 或不命中任何页签时，第一个启用的页签是唯一的 Tab 停靠点', () => {
        const first = mountTabs({ activeKey: null }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]);
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
        first.unmount();

        const second = mountTabs({ defaultActiveKey: 'missing' });
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
        second.unmount();

        mountTabs({ activeKey: null }, threePanes.slice(0, 2), {
            tabBar: ({ tabBarProps }: TabsTabBarSlotProps) => (
                <div role="tablist">
                    {tabBarProps.list.map((item) => (
                        <TabItem key={item.itemKey} itemKey={item.itemKey}>
                            {{ tab: () => item.tab }}
                        </TabItem>
                    ))}
                </div>
            ),
        });
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
    });

    it('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动焦点也不选中', () => {
        const onChange = changeSpy();
        mountTabs({ onChange });
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

    it('more：选中的页签收进菜单时，面板仍以该页签的名称命名', () => {
        const { unmount } = mountTabs({ more: 2, defaultActiveKey: 'c' });
        expect(screen.getByRole('tabpanel', { name: 'C' })).toBeInTheDocument();
        unmount();

        render(Tabs, {
            props: {
                more: 1,
                defaultActiveKey: 'b',
                tabList: [
                    { itemKey: 'a', tab: 'A' },
                    { itemKey: 'b', tab: 'B' },
                ],
            },
            slots: { default: () => 'content' },
        });
        expect(screen.getByRole('tabpanel', { name: 'B' })).toHaveTextContent('content');
    });
});
