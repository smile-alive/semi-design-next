import { batch, createSignal, For, Index, type JSX, onCleanup, onMount, Show } from 'solid-js';
import { fireEvent, render, screen, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mockResizeObserver } from '@test/utils/solid';
import Tabs, { type OverflowItem, type PlainTab, type TabBarProps, type TabPaneProps, type TabsProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';

// jsdom has no layout, so these tests assert the native scrollIntoView path; the fallback is covered by supports.test.ts
vi.mock('@fibrae/semi-foundation/utils/supports', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@fibrae/semi-foundation/utils/supports')>()),
    scrollIntoViewWithin: (el: Element, _scroller: HTMLElement, options: ScrollIntoViewOptions) => el.scrollIntoView({ ...options, container: 'nearest' } as ScrollIntoViewOptions),
}));

const { TabPane, TabItem } = Tabs;

type Change = NonNullable<TabsProps['onChange']>;
type TabClick = NonNullable<TabsProps['onTabClick']>;
type TabClose = NonNullable<TabsProps['onTabClose']>;

interface PaneData extends TabPaneProps {
    itemKey: string;
}

const prefix = `${BASE_CLASS_PREFIX}-tabs`;
const ACTIVE = `.${prefix}-tab-active`;

const twoPanes: PaneData[] = [
    { itemKey: 'itemKeyA', tab: 'titleA', children: 'contentA' },
    { itemKey: 'itemKeyB', tab: 'titleB', children: 'contentB' },
];

const threePanes: PaneData[] = [
    { itemKey: 'a', tab: 'A', children: 'content a' },
    { itemKey: 'b', tab: 'B', children: 'content b' },
    { itemKey: 'c', tab: 'C', children: 'content c' },
];

const threeTabs: PlainTab[] = threePanes.map(({ itemKey }) => ({ itemKey, tab: itemKey.toUpperCase() }));

function renderTabs(props: TabsProps = {}, panes: PaneData[] = threePanes) {
    return render(() => (
        <Tabs {...props}>
            <For each={panes}>{(pane) => <TabPane {...pane} />}</For>
        </Tabs>
    ));
}

const tab = (name: string) => screen.getByRole('tab', { name });
const tabNames = () => screen.queryAllByRole('tab').map((item) => item.textContent);
const selectedTab = () => screen.queryByRole('tab', { selected: true })?.textContent ?? null;
const getActiveTab = (container: HTMLElement) => container.querySelector(ACTIVE);
const getBar = () => document.querySelector(`.${prefix}-bar`) as HTMLElement;
const getContent = (container: HTMLElement) => container.querySelector(`.${prefix}-content`) as HTMLElement;
const paneOf = (container: HTMLElement, itemKey: string) => container.querySelector(`[role="tabpanel"][id$="-panel-${itemKey}"]`) as HTMLElement;
const overlayOf = (container: HTMLElement, itemKey: string) => paneOf(container, itemKey).querySelector(`.${prefix}-pane-motion-overlay`) as HTMLElement;
const animate = (dir: string) => `${prefix}-pane-animate-${dir}Show`;
const closeButtons = () => screen.queryAllByRole('button', { name: zh_CN.Tabs.close });

describe('Tabs', () => {
    it('基础渲染 tabs', () => {
        const { container } = renderTabs({}, twoPanes);
        expect(getContent(container).children).toHaveLength(2);
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(2);
        expect(getActiveTab(container)).toHaveTextContent(/^titleA$/);
        expect(tab('titleA')).toHaveAttribute('aria-selected', 'true');
    });

    it('Tabs 带自定义 class、style 和 contentStyle', () => {
        const { container } = renderTabs({ class: 'test', style: { color: 'red' }, contentStyle: { color: 'blue' } }, twoPanes);
        const root = container.querySelector('div.test');
        expect(root).toBe(container.firstChild);
        expect(root).toHaveClass(prefix, `${prefix}-top`);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getContent(container)).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    });

    it('Tabs 带 defaultActiveKey', () => {
        const { container } = renderTabs({ defaultActiveKey: 'itemKeyB' }, twoPanes);
        expect(getActiveTab(container)).toHaveTextContent(/^titleB$/);
    });

    it.each([
        ['line', false, false],
        ['card', false, true],
        ['button', true, false],
    ] as const)('type=%s 的标签栏类名', (type, button, card) => {
        renderTabs({ type }, twoPanes);
        expect(getBar().classList.contains(`${prefix}-bar-button`)).toBe(button);
        expect(getBar().classList.contains(`${prefix}-bar-card`)).toBe(card);
    });

    it('tabList：标签来自数据，children 是所选标签的内容', () => {
        const tabList = [
            { tab: '文档', itemKey: '1' },
            { tab: '快速起步', itemKey: '2' },
            { tab: '帮助', itemKey: '3' },
        ];
        const { container } = render(() => (
            <Tabs tabList={tabList}>
                <div>文档</div>
            </Tabs>
        ));
        expect(getContent(container).children).toHaveLength(1);
        expect(getContent(container)).toHaveTextContent(/^文档$/);
        expect(tabNames()).toEqual(['文档', '快速起步', '帮助']);
    });

    it('点击禁用的面板时不切换', async () => {
        const onChange = vi.fn<Change>();
        const { container } = renderTabs({ defaultActiveKey: 'itemKeyA', onChange }, [
            { itemKey: 'itemKeyA', tab: 'titleA' },
            { itemKey: 'itemKeyB', tab: 'titleB', disabled: true },
        ]);
        const disabledTabs = container.querySelectorAll(`.${prefix}-tab-disabled`);
        expect(disabledTabs).toHaveLength(1);
        expect(disabledTabs[0]).toHaveTextContent(/^titleB$/);
        await userEvent.click(tab('titleB'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getActiveTab(container)).toHaveTextContent(/^titleA$/);
    });

    it('onTabClick 收到 itemKey', async () => {
        const onTabClick = vi.fn<TabClick>();
        renderTabs({ onTabClick }, twoPanes);
        await userEvent.click(tab('titleB'));
        expect(onTabClick).toHaveBeenCalledTimes(1);
        expect(onTabClick.mock.calls[0][0]).toBe('itemKeyB');
    });

    it('onChange 收到 itemKey，非受控时切换', async () => {
        const onChange = vi.fn<Change>();
        const { container } = renderTabs({ onChange }, twoPanes);
        await userEvent.click(tab('titleB'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('itemKeyB');
        expect(getActiveTab(container)).toHaveTextContent(/^titleB$/);
    });

    it('activeKey 变化时更新', () => {
        const [activeKey, setActiveKey] = createSignal('itemKeyA');
        const { container } = render(() => (
            <Tabs activeKey={activeKey()}>
                <For each={twoPanes}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        expect(getActiveTab(container)).toHaveTextContent(/^titleA$/);
        setActiveKey('itemKeyB');
        expect(getActiveTab(container)).toHaveTextContent(/^titleB$/);
    });

    it('tabList 从空数组变为非空后，非受控的 Tabs 选中第一个可用页签', () => {
        const [list, setList] = createSignal<PlainTab[]>([]);
        render(() => <Tabs tabList={list()} />);
        setList([
            { itemKey: 'a', tab: '甲', disabled: true },
            { itemKey: 'b', tab: '乙' },
        ]);
        expect(tab('乙')).toHaveAttribute('aria-selected', 'true');
        expect(tab('甲')).toHaveAttribute('aria-selected', 'false');
    });

    it('closable：关闭后由使用方移除面板，非受控的选中项回落到第一个', async () => {
        const [list, setList] = createSignal([
            { tab: '文档', itemKey: '1', closable: true },
            { tab: '快速起步', itemKey: '2', closable: true },
            { tab: '帮助', itemKey: '3' },
        ]);
        const close = (key: string) => setList(list().filter((item) => item.itemKey !== key));
        const { container } = render(() => (
            <Tabs type="card" defaultActiveKey="1" onTabClose={close}>
                <For each={list()}>
                    {(item) => (
                        <TabPane closable={item.closable} itemKey={item.itemKey} tab={item.tab}>
                            {item.tab}
                        </TabPane>
                    )}
                </For>
            </Tabs>
        ));
        const closeSelector = `.${prefix}-tab-icon-close`;
        const [first, second, third] = screen.getAllByRole('tab');
        expect(first.querySelector(closeSelector)).not.toBeNull();
        expect(second.querySelector(closeSelector)).not.toBeNull();
        expect(third.querySelector(closeSelector)).toBeNull();

        await userEvent.click(closeButtons()[0]);
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);
        expect(tabs[0]).toHaveTextContent(/^快速起步$/);
        expect(getActiveTab(container)).toBe(tabs[0]);
    });

    it('tabbar 首次渲染正确', () => {
        const { container } = renderTabs({}, twoPanes);
        expect(container).toHaveTextContent('titleA');
        expect(screen.getByRole('tablist')).toHaveTextContent(/^titleAtitleB$/);
    });

    it('两个 Tabs 共用 itemKey 时，各面板由各自的标签标识', () => {
        render(() => (
            <>
                <Tabs defaultActiveKey="k">
                    <TabPane itemKey="k" tab="first">
                        one
                    </TabPane>
                </Tabs>
                <Tabs defaultActiveKey="k">
                    <TabPane itemKey="k" tab="second">
                        two
                    </TabPane>
                </Tabs>
            </>
        ));
        const [firstPanel, secondPanel] = screen.getAllByRole('tabpanel');
        expect(firstPanel).toHaveAccessibleName('first');
        expect(secondPanel).toHaveAccessibleName('second');
        const [firstTab, secondTab] = screen.getAllByRole('tab');
        expect(firstTab.getAttribute('aria-controls')).toBe(firstPanel.id);
        expect(secondTab.getAttribute('aria-controls')).toBe(secondPanel.id);
    });

    it('使用 tabList 时，内容区域为所选标签控制的面板', () => {
        render(() => (
            <Tabs
                defaultActiveKey="2"
                tabList={[
                    { tab: 'Document', itemKey: '1' },
                    { tab: 'Help', itemKey: '2' },
                ]}
            >
                <div>content</div>
            </Tabs>
        ));
        const panel = screen.getByRole('tabpanel');
        expect(screen.getByRole('tab', { selected: true }).getAttribute('aria-controls')).toBe(panel.id);
        expect(panel).toHaveAccessibleName('Help');
        expect(panel).toHaveTextContent('content');
    });

    it('通过 renderTabBar 渲染的 TabItem 控制其所在 Tabs 的面板', () => {
        render(() => (
            <Tabs
                defaultActiveKey="a"
                renderTabBar={(barProps) => (
                    <div role="tablist">
                        <For each={barProps.list}>{(item) => <TabItem itemKey={item.itemKey} selected={item.itemKey === barProps.activeKey} tab={item.itemKey} />}</For>
                    </div>
                )}
            >
                <TabPane itemKey="a" tab="custom">
                    content
                </TabPane>
            </Tabs>
        ));
        expect(screen.getByRole('tabpanel')).toHaveAccessibleName('a');
    });
});

describe('Tabs 收集 TabPane', () => {
    it('首帧：render 返回时已有标签，默认选中第一个可用项', () => {
        render(() => (
            <Tabs>
                <TabPane itemKey="a" tab="A" disabled />
                <TabPane itemKey="b" tab="B" />
            </Tabs>
        ));
        expect(tabNames()).toEqual(['A', 'B']);
        expect(selectedTab()).toBe('B');
    });

    it('Show、For、Index、Fragment 与数组里的 TabPane 都被收集，文本与元素按原顺序作为内容渲染', () => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = render(() => (
            <Tabs>
                <TabPane itemKey="a" tab="A" />
                text
                <Show when>
                    <TabPane itemKey="b" tab="B" />
                </Show>
                <For each={['c']}>{(key) => <TabPane itemKey={key} tab={key.toUpperCase()} />}</For>
                <Index each={['d']}>{(key) => <TabPane itemKey={key()} tab={key().toUpperCase()} />}</Index>
                <>
                    <TabPane itemKey="e" tab="E" />
                    <span>fragment-content</span>
                </>
                {[<TabPane itemKey="f" tab="F" />]}
            </Tabs>
        ));
        expect(tabNames()).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
        expect(screen.getByText('fragment-content')).toBeInTheDocument();
        const order = [...getContent(container).childNodes].map((node) => (node instanceof Element && node.getAttribute('role') === 'tabpanel' ? 'pane' : node.textContent));
        expect(order).toEqual(['pane', 'text', 'pane', 'pane', 'pane', 'pane', 'fragment-content', 'pane']);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('包装组件返回的 TabPane 也被收集为页签', () => {
        function MyPane(props: TabPaneProps) {
            return <TabPane {...props} />;
        }
        render(() => (
            <Tabs>
                <MyPane itemKey="a" tab="A">
                    content a
                </MyPane>
            </Tabs>
        ));
        expect(tabNames()).toEqual(['A']);
        expect(screen.getByRole('tabpanel')).toHaveTextContent('content a');
    });

    it('For 增删重排：保留其余面板的节点，删除的面板释放其内容，非受控删除选中项回落第一个可用项', () => {
        const cleanup = vi.fn<(key: string) => void>();
        function Content(props: { name: string }) {
            onCleanup(() => cleanup(props.name));
            return <span>{props.name}</span>;
        }
        const [keys, setKeys] = createSignal(['a', 'c']);
        render(() => (
            <Tabs defaultActiveKey="c">
                <For each={keys()}>
                    {(key) => (
                        <TabPane itemKey={key} tab={key.toUpperCase()} disabled={key === 'a'}>
                            <Content name={key} />
                        </TabPane>
                    )}
                </For>
            </Tabs>
        ));
        const a = screen.getByText('a');
        const c = screen.getByText('c');
        const tabC = tab('C');

        setKeys(['a', 'b', 'c']);
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        expect(screen.getByText('a')).toBe(a);
        expect(screen.getByText('c')).toBe(c);
        expect(tab('C')).toBe(tabC);
        expect(selectedTab()).toBe('C');

        setKeys(['c', 'b', 'a']);
        expect(tabNames()).toEqual(['C', 'B', 'A']);
        expect(screen.getByText('a')).toBe(a);
        expect(tab('C')).toBe(tabC);

        setKeys(['b', 'a']);
        expect(cleanup).toHaveBeenCalledExactlyOnceWith('c');
        expect(selectedTab()).toBe('B');
    });

    it('单个 TabPane 的属性随 signal 原地更新，标签节点不重建，TabPane 组件体只执行一次', () => {
        const [title, setTitle] = createSignal('B');
        const [disabled, setDisabled] = createSignal(false);
        const [closable, setClosable] = createSignal(false);
        const [icon, setIcon] = createSignal(false);
        const body = vi.fn<() => void>();
        function SpyPane(props: TabPaneProps) {
            body();
            return <TabPane {...props} />;
        }
        const { container } = render(() => (
            <Tabs>
                <TabPane itemKey="a" tab="A" />
                <SpyPane itemKey="b" tab={title()} disabled={disabled()} closable={closable()} icon={icon() ? <i>icon</i> : undefined} />
            </Tabs>
        ));
        const tabB = tab('B');
        setTitle('Beta');
        setDisabled(true);
        setClosable(true);
        setIcon(true);
        expect(screen.getAllByRole('tab')[1]).toBe(tabB);
        expect(tabB).toHaveTextContent(/^iconBeta/);
        expect(tabB).toHaveAttribute('aria-disabled', 'true');
        expect(tabB.querySelector(`.${prefix}-tab-icon-close`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-bar-icon`)).toHaveTextContent('icon');
        expect(body).toHaveBeenCalledTimes(1);
    });

    it('TabPane 在 Tabs 外不渲染任何内容', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <div>
                <TabPane itemKey="a" tab="A">
                    content
                </TabPane>
            </div>
        ));
        expect(container.firstElementChild).toBeEmptyDOMElement();
        warn.mockRestore();
    });
});

describe('Tabs 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('onTabClick 接收 key 和事件；点击已选中的标签不调用 onChange', async () => {
        const onTabClick = vi.fn<TabClick>();
        const onChange = vi.fn<Change>();
        renderTabs({ onTabClick, onChange });
        await userEvent.click(tab('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(onTabClick).toHaveBeenCalledTimes(1);
        expect(onTabClick.mock.lastCall?.[0]).toBe('a');
        expect(onTabClick.mock.lastCall?.[1]).toBeInstanceOf(MouseEvent);
        await userEvent.click(tab('C'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
        expect(onTabClick.mock.lastCall?.[0]).toBe('c');
    });

    it('键盘激活时 onTabClick 收到 keydown 事件，类型为鼠标与键盘事件的联合', async () => {
        const onTabClick = vi.fn<TabClick>();
        renderTabs({ onTabClick });
        tab('B').focus();
        await userEvent.keyboard('{Enter}');
        expect(onTabClick).toHaveBeenCalledExactlyOnceWith('b', expect.objectContaining({ type: 'keydown' }));
        expect(onTabClick.mock.lastCall?.[1]).toBeInstanceOf(KeyboardEvent);
        expectTypeOf<Parameters<TabClick>[1]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
    });

    it('受控时点击只报告 key；移除 activeKey 后从最后的受控 key 继续', async () => {
        const onChange = vi.fn<Change>();
        const [activeKey, setActiveKey] = createSignal<string | undefined>('a');
        render(() => (
            <Tabs activeKey={activeKey()} onChange={onChange}>
                <For each={threePanes}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('A');
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledTimes(2);

        setActiveKey('c');
        expect(selectedTab()).toBe('C');
        setActiveKey(undefined);
        expect(selectedTab()).toBe('C');
        await userEvent.click(tab('A'));
        expect(onChange).toHaveBeenLastCalledWith('a');
        expect(selectedTab()).toBe('A');
    });

    it('父组件挂载时就改了 activeKey，移除 activeKey 后从新值继续', () => {
        const [activeKey, setActiveKey] = createSignal<string | undefined>('a');
        function Demo() {
            onMount(() => setActiveKey('c'));
            return (
                <Tabs activeKey={activeKey()}>
                    <For each={threePanes}>{(pane) => <TabPane {...pane} />}</For>
                </Tabs>
            );
        }
        render(() => <Demo />);
        expect(selectedTab()).toBe('C');
        setActiveKey(undefined);
        expect(selectedTab()).toBe('C');
    });

    it('activeKey={undefined} 按非受控处理：取 defaultActiveKey，点击即切换', async () => {
        renderTabs({ activeKey: undefined, defaultActiveKey: 'b' });
        expect(selectedTab()).toBe('B');
        await userEvent.click(tab('C'));
        expect(selectedTab()).toBe('C');
    });

    it('activeKey={null} 不选中任何标签，也不抛错，点击仍只报告 key', async () => {
        const onChange = vi.fn<Change>();
        renderTabs({ activeKey: null, onChange });
        expect(selectedTab()).toBeNull();
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledWith('b');
        expect(selectedTab()).toBeNull();
    });

    it('一次点击 onChange 只调用一次，面板随之切换并播放动画', async () => {
        const onChange = vi.fn<Change>();
        const { container } = renderTabs({ onChange });
        await userEvent.click(tab('B'));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
        expect(selectedTab()).toBe('B');
        expect(overlayOf(container, 'b')).toHaveClass(animate('left'));
    });

    it('keepDOM={false} 时只挂载所选面板，切走的面板释放其内容', async () => {
        const cleanup = vi.fn<(key: string) => void>();
        function Content(props: { name: string }) {
            onCleanup(() => cleanup(props.name));
            return <>{`content ${props.name}`}</>;
        }
        render(() => (
            <Tabs keepDOM={false}>
                <For each={threePanes}>
                    {(pane) => (
                        <TabPane itemKey={pane.itemKey} tab={pane.tab}>
                            <Content name={pane.itemKey} />
                        </TabPane>
                    )}
                </For>
            </Tabs>
        ));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content a$/);
        await userEvent.click(tab('C'));
        expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1);
        expect(screen.getByRole('tabpanel')).toHaveTextContent(/^content c$/);
        expect(cleanup).toHaveBeenCalledExactlyOnceWith('a');
    });

    it('keepDOM={false} 切换时新挂载的面板播放滑入动画', async () => {
        const { container } = renderTabs({ keepDOM: false });
        await userEvent.click(tab('C'));
        expect(overlayOf(container, 'c')).toHaveClass(animate('left'));
    });

    it('lazyRender 在面板首次激活时渲染，之后保留', async () => {
        renderTabs({ lazyRender: true });
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
        const { container, unmount } = renderTabs();
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
        expect(container.firstChild).toHaveClass(prefix, `${prefix}-top`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-line`, `${prefix}-tab-top`, `${prefix}-tab-single`);
        unmount();

        const { container: left } = renderTabs({ tabPosition: 'left', size: 'small', type: 'card' });
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
        expect(getBar()).toHaveClass(`${prefix}-bar`, `${prefix}-bar-card`, `${prefix}-bar-left`);
        expect(left.firstChild).toHaveClass(`${prefix}-left`);
        expect(getContent(left)).toHaveClass(`${prefix}-content-left`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-card`, `${prefix}-tab-left`, `${prefix}-tab-small`);
        expect(tab('A')).not.toHaveClass(`${prefix}-tab-medium`);
    });

    it('roving tabindex，以及标签与面板之间的 aria 关联', () => {
        renderTabs(
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

    it('只有面板在文档中时，标签才指向该面板', () => {
        const { unmount } = render(() => <Tabs tabList={threeTabs}>content</Tabs>);
        const panel = screen.getByRole('tabpanel');
        expect(screen.getAllByRole('tab').map((item) => item.getAttribute('aria-controls'))).toEqual([panel.id, null, null]);
        unmount();

        renderTabs({ keepDOM: false });
        const pane = screen.getByRole('tabpanel');
        expect(screen.getAllByRole('tab').map((item) => item.getAttribute('aria-controls'))).toEqual([pane.id, null, null]);
    });

    it('itemKey 含空格时 id 经过编码，标签与面板一一对应', () => {
        renderTabs({}, [
            { itemKey: 'a b', tab: 'A', children: 'a' },
            { itemKey: 'c "d"', tab: 'C', children: 'c' },
        ]);
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        screen.getAllByRole('tab').forEach((item, i) => {
            // an id holding a space would be read as two IDREFs
            expect(item.id).not.toMatch(/\s/);
            expect(panels[i].id).not.toMatch(/\s/);
            expect(item.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(item.id);
        });
    });

    it('键盘：方向键跳过禁用标签并循环移动，Home 和 End 跳转，Enter 选择', async () => {
        const onChange = vi.fn<Change>();
        const panes = [...threePanes, { itemKey: 'd', tab: 'D', disabled: true }, { itemKey: 'e', tab: 'E' }];
        renderTabs(
            { onChange },
            panes.map((pane) => (pane.itemKey === 'c' ? { ...pane, disabled: true } : pane))
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
        render(() => (
            <ConfigProvider direction="rtl">
                <Tabs>
                    <For each={threePanes}>{(pane) => <TabPane {...pane} />}</For>
                </Tabs>
            </ConfigProvider>
        ));
        tab('A').focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        expect(tab('C')).toHaveFocus();
    });

    it('键盘：垂直标签栏使用上下方向键', async () => {
        renderTabs({ tabPosition: 'left' });
        tab('A').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('A')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        expect(tab('C')).toHaveFocus();
    });

    it('键盘：焦点停在禁用页签上时，方向键移到相邻的可用页签', async () => {
        const panes = [...threePanes, { itemKey: 'd', tab: 'D' }, { itemKey: 'e', tab: 'E' }].map((pane) => (pane.itemKey === 'c' ? { ...pane, disabled: true } : pane));
        renderTabs({}, panes);
        tab('C').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('D')).toHaveFocus();
        tab('C').focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tab('B')).toHaveFocus();
    });

    it('禁用页签聚焦后按 Enter 或 Space 不激活', async () => {
        const onChange = vi.fn<Change>();
        renderTabs({ onChange }, [threePanes[0], { ...threePanes[1], disabled: true }]);
        tab('B').focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });

    it('closable：关闭图标和 Backspace 调用 onTabClose，而非 onTabClick，焦点移到相邻标签', async () => {
        const onTabClose = vi.fn<TabClose>();
        const onTabClick = vi.fn<TabClick>();
        renderTabs(
            { onTabClose, onTabClick },
            threePanes.map((pane) => ({ ...pane, closable: pane.itemKey !== 'c' }))
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

    it('closable：禁用页签的关闭图标照常显示，点击与 Delete 都不关闭', async () => {
        const onTabClose = vi.fn<TabClose>();
        renderTabs({ onTabClose }, [threePanes[0], { ...threePanes[1], closable: true, disabled: true }]);
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.close }));
        tab('B').focus();
        await userEvent.keyboard('{Delete}');
        await userEvent.keyboard('{Backspace}');
        expect(onTabClose).not.toHaveBeenCalled();
    });

    it('关闭图标的名称来自语言包，随 LocaleProvider 切换', () => {
        const [locale, setLocale] = createSignal(zh_CN);
        render(() => (
            <LocaleProvider locale={locale()}>
                <Tabs>
                    <TabPane itemKey="a" tab="A" closable />
                </Tabs>
            </LocaleProvider>
        ));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.close })).toBeInTheDocument();
        setLocale(en_US);
        expect(screen.getByRole('button', { name: en_US.Tabs.close })).toBeInTheDocument();
    });

    it('标签内控件的按键不触发标签的键盘操作', async () => {
        const onTabClose = vi.fn<TabClose>();
        const onTabClick = vi.fn<TabClick>();
        render(() => (
            <Tabs onTabClose={onTabClose} onTabClick={onTabClick}>
                <TabPane itemKey="a" tab={<input aria-label="name" />} closable>
                    content a
                </TabPane>
                <TabPane itemKey="b" tab="B" />
            </Tabs>
        ));
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

    it('tabBarExtraContent 位于标签栏中 tablist 之外，浮动到行尾并保留自身样式', () => {
        const { container } = renderTabs({
            tabBarExtraContent: (
                <button type="button" style={{ color: 'red' }}>
                    Extra
                </button>
            ),
        });
        const extra = container.querySelector(`.${prefix}-bar-extra`) as HTMLElement;
        expect(getBar()).toContainElement(extra);
        expect(screen.getByRole('tablist')).not.toContainElement(extra);
        expect(extra).toHaveAttribute('x-semi-prop', 'tabBarExtraContent');
        expect(extra).toHaveClass(`${prefix}-bar-line-extra`, `${prefix}-bar-line-extra-large`);
        expect(extra.style.getPropertyValue('float')).toBe('inline-end');
        expect(extra.style.color).toBe('');
        expect(screen.getByRole('button', { name: 'Extra' })).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('tabBarExtraContent 元素的 float 由外层继承', () => {
        const { container } = renderTabs({
            tabBarExtraContent: (
                <button type="button" style={{ float: 'left' }}>
                    Extra
                </button>
            ),
        });
        expect((container.querySelector(`.${prefix}-bar-extra`) as HTMLElement).style.getPropertyValue('float')).toBe('left');
    });

    it.each([false, '', null])('tabBarExtraContent 为 %s 时不渲染容器', (extra) => {
        const { container } = renderTabs({ tabBarExtraContent: extra as JSX.Element });
        expect(container.querySelector(`.${prefix}-bar-extra`)).toBeNull();
    });

    it('renderTabBar 只调用一次，收到活的标签栏属性和默认 TabBar', async () => {
        const onChange = vi.fn<Change>();
        const renderTabBar = vi.fn<NonNullable<TabsProps['renderTabBar']>>((barProps, DefaultTabBar) => (
            <div class="wrap">
                <DefaultTabBar {...barProps} data-bar="custom" />
            </div>
        ));
        const { container } = renderTabs({ renderTabBar, onChange, tabBarClassName: 'bar', tabBarStyle: { color: 'red' } });
        const barProps = renderTabBar.mock.calls[0][0];
        expect(barProps).toMatchObject({ activeKey: 'a', class: 'bar', style: { color: 'red' }, size: 'large', type: 'line', tabPosition: 'top' });
        expect(barProps.list?.map((pane) => pane.itemKey)).toEqual(['a', 'b', 'c']);
        const bar = container.querySelector(`.wrap .${prefix}-bar`);
        expect(bar).toHaveClass('bar');
        expect(bar).toHaveAttribute('data-bar', 'custom');
        await userEvent.click(tab('B'));
        await userEvent.click(tab('C'));
        expect(onChange).toHaveBeenLastCalledWith('c');
        expect(selectedTab()).toBe('C');
        expect(barProps.activeKey).toBe('c');
        expect(renderTabBar).toHaveBeenCalledTimes(1);
    });

    it('renderTabBar 在函数体内读取标签栏属性时，切换标签也不重新调用，自绘标签栏节点不变', async () => {
        const renderTabBar = vi.fn<NonNullable<TabsProps['renderTabBar']>>((barProps, DefaultTabBar) => {
            const initialKey = barProps.activeKey;
            return (
                <div class="custom" data-initial={initialKey}>
                    <DefaultTabBar {...barProps} />
                </div>
            );
        });
        const { container } = renderTabs({ renderTabBar });
        const bar = container.querySelector('.custom');
        await userEvent.click(tab('B'));
        await userEvent.click(tab('C'));
        expect(selectedTab()).toBe('C');
        expect(container.querySelector('.custom')).toBe(bar);
        expect(renderTabBar).toHaveBeenCalledTimes(1);
    });

    it('renderTabBar 换成另一个函数后，按新函数重新渲染标签栏', () => {
        type RenderTabBar = NonNullable<TabsProps['renderTabBar']>;
        const renderA = vi.fn<RenderTabBar>((barProps, DefaultTabBar) => <DefaultTabBar {...barProps} class="bar-a" />);
        const renderB = vi.fn<RenderTabBar>((barProps, DefaultTabBar) => <DefaultTabBar {...barProps} class="bar-b" />);
        const [which, setWhich] = createSignal<'a' | 'b'>('a');
        const { container } = renderTabs({
            get renderTabBar() {
                return which() === 'a' ? renderA : renderB;
            },
        });
        expect(container.querySelector('.bar-a')).not.toBeNull();
        setWhich('b');
        expect(container.querySelector('.bar-a')).toBeNull();
        expect(container.querySelector('.bar-b')).not.toBeNull();
        expect(renderA).toHaveBeenCalledTimes(1);
        expect(renderB).toHaveBeenCalledTimes(1);
    });

    it('renderTabBar 中自绘的 TabItem 使用 Tabs 的键盘与关闭处理', async () => {
        const onTabClose = vi.fn<TabClose>();
        render(() => (
            <Tabs
                onTabClose={onTabClose}
                renderTabBar={(barProps) => (
                    <div role="tablist">
                        <For each={barProps.list}>{(pane) => <TabItem itemKey={pane.itemKey} selected={pane.itemKey === barProps.activeKey} tab={pane.itemKey.toUpperCase()} closable onClick={barProps.onTabClick} />}</For>
                    </div>
                )}
            >
                <TabPane itemKey="a" tab="A" />
                <TabPane itemKey="b" tab="B" />
            </Tabs>
        ));
        tab('A').focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(tab('B')).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(selectedTab()).toBe('B');
        await userEvent.click(screen.getAllByRole('button', { name: zh_CN.Tabs.close })[0]);
        expect(onTabClose).toHaveBeenCalledExactlyOnceWith('a');
    });

    it('renderTabBar 传给 DefaultTabBar 的 ref 指向标签栏', () => {
        let ref: HTMLDivElement | undefined;
        render(() => (
            <Tabs renderTabBar={(barProps, DefaultTabBar) => <DefaultTabBar {...barProps} ref={(node) => (ref = node)} />}>
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        ));
        expect(ref).toBe(getBar());
    });

    it('data-* 与 ref 落到根节点和面板', () => {
        let root: HTMLDivElement | undefined;
        let pane: HTMLDivElement | undefined;
        const { container } = render(() => (
            <Tabs data-testid="tabs" ref={(node) => (root = node)}>
                <TabPane data-pane="a" ref={(node) => (pane = node)} itemKey="a" tab="A">
                    a
                </TabPane>
            </Tabs>
        ));
        expect(container.firstChild).toHaveAttribute('data-testid', 'tabs');
        expect(root).toBe(container.firstChild);
        expect(screen.getByRole('tabpanel')).toHaveAttribute('data-pane', 'a');
        expect(pane).toBe(screen.getByRole('tabpanel'));
    });

    it('TabPane 的 id、role 与 aria-labelledby 不被透传属性覆盖，tabIndex 可覆盖，class 与 style 合并', () => {
        // spread so that the lint rules about role do not apply to this deliberate conflict
        const passthrough = { id: 'mine', role: 'region', 'aria-labelledby': 'other', class: 'extra', style: { opacity: 0.5 } } as TabPaneProps;
        render(() => (
            <Tabs>
                <TabPane {...passthrough} tabIndex={-1} itemKey="a" tab="A" />
            </Tabs>
        ));
        const panel = screen.getByRole('tabpanel');
        expect(panel.id).not.toBe('mine');
        expect(panel.getAttribute('aria-labelledby')).toBe(tab('A').id);
        expect(panel).toHaveAttribute('tabindex', '-1');
        expect(panel).toHaveClass('extra', `${prefix}-pane`);
        expect(panel).toHaveStyle({ opacity: '0.5' });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Tabs: { type: 'card', size: 'small' } };
        const { unmount } = renderTabs();
        expect(getBar()).toHaveClass(`${prefix}-bar-card`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-small`);
        unmount();
        renderTabs({ type: 'button' });
        expect(getBar()).toHaveClass(`${prefix}-bar-button`);
        expect(tab('A')).toHaveClass(`${prefix}-tab-small`);
    });

    it('children 变化：新增面板时选中第一个；删除已选中的面板时回退到第一个', () => {
        const [panes, setPanes] = createSignal<PaneData[]>([]);
        render(() => (
            <Tabs>
                <For each={panes()}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        expect(tabNames()).toEqual([]);
        setPanes(threePanes);
        expect(selectedTab()).toBe('A');
        setPanes(threePanes.slice(1));
        expect(selectedTab()).toBe('B');
    });

    it('children 模式移除当前面板时，回退到第一个启用的面板', () => {
        const all = threePanes.map((pane) => (pane.itemKey === 'a' ? { ...pane, disabled: true } : pane));
        const [panes, setPanes] = createSignal(all);
        render(() => (
            <Tabs defaultActiveKey="c">
                <For each={panes()}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        expect(selectedTab()).toBe('C');
        setPanes(all.slice(0, 2));
        expect(selectedTab()).toBe('B');
    });

    it('非受控时在前面插入面板，选中项不变', () => {
        const [panes, setPanes] = createSignal(threePanes.slice(1));
        render(() => (
            <Tabs defaultActiveKey="c">
                <For each={panes()}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        setPanes(threePanes);
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        expect(selectedTab()).toBe('C');
    });

    it('tabList 模式移除当前 key 后，选中第一个启用的页签', () => {
        const all = threeTabs.map((item) => ({ ...item, disabled: item.itemKey === 'a' }));
        const [list, setList] = createSignal(all);
        render(() => <Tabs defaultActiveKey="c" tabList={list()} />);
        expect(selectedTab()).toBe('C');
        setList(all.slice(0, 2));
        expect(tabNames()).toEqual(['A', 'B']);
        expect(selectedTab()).toBe('B');
    });

    it('父组件挂载时就移除了当前 key，非受控时选中第一个启用的页签', () => {
        const all = threeTabs;
        const [list, setList] = createSignal(all);
        function Demo() {
            onMount(() => setList(all.slice(1)));
            return <Tabs tabList={list()} />;
        }
        render(() => <Demo />);
        expect(selectedTab()).toBe('B');
    });

    it('tabList 每次传入数据相同的新对象时，renderTab 不再调用，标签节点、焦点与标签内输入框的值都保留', async () => {
        const makeList = (): PlainTab[] => [
            { itemKey: 'a', tab: 'A' },
            { itemKey: 'b', tab: 'B' },
        ];
        const [list, setList] = createSignal(makeList());
        const renderTab = vi.fn<NonNullable<TabsProps['renderTab']>>((item) => (item.itemKey === 'a' ? <input aria-label="name" /> : item.tab));
        render(() => <Tabs tabList={list()} renderTab={renderTab} />);
        const tabB = tab('B');
        await userEvent.type(screen.getByRole('textbox', { name: 'name' }), 'xy');
        setList(makeList());
        expect(tab('B')).toBe(tabB);
        expect(screen.getByRole('textbox', { name: 'name' })).toHaveFocus();
        expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('xy');
        expect(renderTab).toHaveBeenCalledTimes(2);
    });

    it('defaultActiveKey 不在页签中时不选中任何面板', () => {
        renderTabs({ defaultActiveKey: 'zzz' });
        expect(selectedTab()).toBeNull();
    });

    it('motion：所选面板从上一个标签的一侧滑入', async () => {
        const { container } = renderTabs();
        expect(overlayOf(container, 'a').className).not.toContain('animate');
        await userEvent.click(tab('C'));
        expect(overlayOf(container, 'c')).toHaveClass(animate('left'));
        expect(overlayOf(container, 'a').className).not.toContain('animate');
        await userEvent.click(tab('B'));
        expect(overlayOf(container, 'b')).toHaveClass(animate('right'));
    });

    it('motion：父组件挂载时就切换了 activeKey，所选面板播放滑入动画', () => {
        const [activeKey, setActiveKey] = createSignal('a');
        function Demo() {
            onMount(() => setActiveKey('c'));
            return (
                <Tabs activeKey={activeKey()}>
                    <For each={threePanes}>{(pane) => <TabPane {...pane} />}</For>
                </Tabs>
            );
        }
        const { container } = render(() => <Demo />);
        expect(overlayOf(container, 'c')).toHaveClass(animate('left'));
    });

    it('motion：垂直标签栏上下滑动，tabPaneMotion={false} 时关闭动画', async () => {
        const { container, unmount } = renderTabs({ tabPosition: 'left' });
        await userEvent.click(tab('B'));
        expect(overlayOf(container, 'b')).toHaveClass(animate('top'));
        await userEvent.click(tab('A'));
        expect(overlayOf(container, 'a')).toHaveClass(animate('bottom'));
        unmount();

        const { container: still } = renderTabs({ tabPaneMotion: false });
        await userEvent.click(tab('B'));
        expect(overlayOf(still, 'b').className).not.toContain('animate');
    });

    it('motion：新增并同时选中的面板，或删除所选面板后，不播放动画', () => {
        const [panes, setPanes] = createSignal(threePanes.slice(0, 2));
        const [activeKey, setActiveKey] = createSignal<string | undefined>('a');
        const { container } = render(() => (
            <Tabs activeKey={activeKey()}>
                <For each={panes()}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        setActiveKey('b');
        expect(overlayOf(container, 'b').className).toContain(`${prefix}-pane-animate`);
        // one update, as a parent changing both props at once
        batch(() => {
            setPanes(threePanes);
            setActiveKey('c');
        });
        expect(selectedTab()).toBe('C');
        expect(overlayOf(container, 'c').className).not.toContain('animate');

        setActiveKey(undefined);
        setPanes(threePanes.slice(0, 2));
        expect(selectedTab()).toBe('A');
        expect(overlayOf(container, 'a').className).not.toContain('animate');
    });

    it('motion：不在 batch 中先新增面板、再选中它，是两次更新，新面板播放滑入动画', async () => {
        const [panes, setPanes] = createSignal(threePanes.slice(0, 2));
        const [activeKey, setActiveKey] = createSignal('a');
        const { container } = render(() => (
            <>
                <button
                    type="button"
                    onClick={() => {
                        setPanes(threePanes);
                        setActiveKey('c');
                    }}
                >
                    add
                </button>
                <Tabs activeKey={activeKey()}>
                    <For each={panes()}>{(pane) => <TabPane {...pane} />}</For>
                </Tabs>
            </>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'add' }));
        expect(selectedTab()).toBe('C');
        expect(overlayOf(container, 'c')).toHaveClass(animate('left'));
    });

    it('motion：动画结束后去掉面板的方向 class，再次选中时重新播放', async () => {
        const { container } = renderTabs();
        await userEvent.click(tab('B'));
        const overlay = overlayOf(container, 'b');
        fireEvent.animationEnd(overlay);
        expect(overlay.className).not.toContain('animate');
        await userEvent.click(tab('A'));
        await userEvent.click(tab('B'));
        expect(overlay).toHaveClass(animate('left'));
    });

    it('motion：动画结束后，增删其他面板不重新播放所选面板的动画', async () => {
        const [panes, setPanes] = createSignal(threePanes.slice(0, 2));
        const { container } = render(() => (
            <Tabs>
                <For each={panes()}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        await userEvent.click(tab('B'));
        const overlay = overlayOf(container, 'b');
        fireEvent.animationEnd(overlay);
        setPanes(threePanes);
        expect(selectedTab()).toBe('B');
        expect(overlay.className).not.toContain('animate');
    });

    it('motion：面板内容冒泡上来的 animationend 不结束面板动画', async () => {
        const { container } = render(() => (
            <Tabs>
                <TabPane itemKey="a" tab="A" />
                <TabPane itemKey="b" tab="B">
                    <span>inner</span>
                </TabPane>
            </Tabs>
        ));
        await userEvent.click(tab('B'));
        fireEvent.animationEnd(screen.getByText('inner'));
        expect(overlayOf(container, 'b')).toHaveClass(animate('left'));
    });

    it('TabItem 的 ref 落在标签元素上，role、tabIndex 与 aria 状态优先于透传属性，并合并 class 与 style', () => {
        let ref: HTMLDivElement | undefined;
        // spread so that the lint rules about role and tabIndex do not apply to this deliberate conflict
        const passthrough = { role: 'button', tabIndex: 5, 'aria-selected': false, class: 'extra', style: { opacity: 0.5 }, 'data-x': '1' } as const;
        render(() => (
            <Tabs renderTabBar={() => <TabItem {...passthrough} ref={(node) => (ref = node)} itemKey="a" selected tab="A" />}>
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        ));
        const el = tab('A');
        expect(ref).toBe(el);
        expect(el).toHaveAttribute('tabindex', '0');
        expect(el).toHaveAttribute('aria-selected', 'true');
        expect(el).toHaveClass('extra', `${prefix}-tab`);
        expect(el).toHaveStyle({ opacity: '0.5' });
        expect(el).toHaveAttribute('data-x', '1');
    });

    it('TabItem 的 onClick 收到 itemKey 与事件，禁用时不调用；使用方的 onKeyDown 先于标签的键盘处理', async () => {
        const onClick = vi.fn<(itemKey: string, event: MouseEvent) => void>();
        const order: string[] = [];
        const [disabled, setDisabled] = createSignal(false);
        render(() => (
            <Tabs
                onTabClick={() => order.push('tab')}
                renderTabBar={() => (
                    <div role="tablist">
                        <TabItem itemKey="a" tab="A" selected disabled={disabled()} onClick={onClick} onKeyDown={() => order.push('user')} />
                    </div>
                )}
            >
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        ));
        await userEvent.click(tab('A'));
        expect(onClick).toHaveBeenCalledExactlyOnceWith('a', expect.any(MouseEvent));
        tab('A').focus();
        await userEvent.keyboard('{Enter}');
        expect(order).toEqual(['user', 'tab']);
        setDisabled(true);
        await userEvent.click(tab('A'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Tabs 外部的 TabItem 没有悬空的 id 或 aria-controls，类名不含 undefined，点击关闭图标不抛错', async () => {
        render(() => <TabItem closable itemKey="a" tab="A" />);
        expect(tab('A')).not.toHaveAttribute('id');
        expect(tab('A')).not.toHaveAttribute('aria-controls');
        expect(tab('A').className).not.toContain('undefined');
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.close }));
    });

    it('未知属性不进入 DOM，面板内部的原生 change 不调用 onChange', async () => {
        const onChange = vi.fn<Change>();
        render(() => (
            <Tabs preventScroll onChange={onChange}>
                <TabPane itemKey="a" tab="A" icon={<span>i</span>}>
                    <input aria-label="field" />
                </TabPane>
            </Tabs>
        ));
        await userEvent.type(screen.getByRole('textbox', { name: 'field' }), 'x');
        fireEvent.change(screen.getByRole('textbox', { name: 'field' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('tabpanel')).not.toHaveAttribute('tab');
        expect(screen.getByRole('tabpanel')).not.toHaveAttribute('icon');
    });

    it('tabList 为空数组时不把 children 当作页签，内容区不引用不存在的 tab', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <Tabs tabList={[]}>
                <TabPane itemKey="a" tab="A" />
                <div>content</div>
            </Tabs>
        ));
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        expect(screen.queryAllByRole('tabpanel')).toHaveLength(0);
        expect(container.querySelector('[aria-labelledby]')).toBeNull();
        expect(getContent(container)).toHaveTextContent(/^content$/);
        warn.mockRestore();
    });

    it('tabList 为空数组且 children 是字符串时不抛错', () => {
        render(() => <Tabs tabList={[]}>text</Tabs>);
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
    });

    it('children 模式只把 TabPane 当作页签，字符串与其他元素是内容', () => {
        const { unmount } = render(() => (
            <Tabs>
                <TabPane itemKey="a" tab="A">
                    pa
                </TabPane>
                <div>extra</div>
            </Tabs>
        ));
        expect(screen.getAllByRole('tab')).toHaveLength(1);
        expect(screen.getByText('extra')).toBeInTheDocument();
        unmount();
        render(() => <Tabs>text</Tabs>);
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('aria-label 与 aria-labelledby 落到 tablist，其余属性仍落根元素', () => {
        const { container, unmount } = render(() => (
            <Tabs data-x="1" aria-label="Sections">
                <TabPane itemKey="a" tab="A" />
            </Tabs>
        ));
        expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
        expect(container.firstChild).toHaveAttribute('data-x', '1');
        expect(container.firstChild).not.toHaveAttribute('aria-label');
        unmount();
        render(() => (
            <>
                <h2 id="h">Heading</h2>
                <Tabs aria-labelledby="h" more={1}>
                    <TabPane itemKey="a" tab="A" />
                    <TabPane itemKey="b" tab="B" />
                </Tabs>
            </>
        ));
        expect(screen.getByRole('tablist', { name: 'Heading' })).toBeInTheDocument();
    });

    it('keepDOM={false} 且只有一个子项时，未选中的面板不挂载', () => {
        render(() => (
            <Tabs activeKey={null} keepDOM={false}>
                <TabPane itemKey="a" tab="A">
                    content-a
                </TabPane>
            </Tabs>
        ));
        expect(screen.queryByText('content-a')).toBeNull();
        expect(tab('A')).not.toHaveAttribute('aria-controls');
    });

    it('类型：TabBarProps 的 activeKey 可为 null，renderArrow 收到 OverflowItem', () => {
        expectTypeOf<TabBarProps['activeKey']>().toEqualTypeOf<string | null | undefined>();
        expectTypeOf<Parameters<NonNullable<TabsProps['renderArrow']>>[0]>().toEqualTypeOf<OverflowItem[]>();
        expectTypeOf<Parameters<NonNullable<TabsProps['renderArrow']>>[3]>().toEqualTypeOf<() => JSX.Element>();
    });

    it('类型：tabList 的数据项只放数据，内容交给 renderTab、renderIcon', () => {
        expectTypeOf<PlainTab['tab']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<PlainTab>().not.toHaveProperty('icon');
        expectTypeOf<NonNullable<TabsProps['renderTab']>>().toEqualTypeOf<(item: PlainTab, index: number) => JSX.Element>();
        expectTypeOf<NonNullable<TabsProps['renderIcon']>>().toEqualTypeOf<(item: PlainTab, index: number) => JSX.Element>();
    });
});

// Records which nodes each observer watches; `intersect` reports visibility by scroll key to every live observer
function stubIntersectionObserver() {
    const observers: { callback: IntersectionObserverCallback; elements: Set<HTMLElement> }[] = [];
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            callback: IntersectionObserverCallback;
            elements = new Set<HTMLElement>();

            constructor(callback: IntersectionObserverCallback) {
                this.callback = callback;
                observers.push(this);
            }

            observe(element: HTMLElement) {
                this.elements.add(element);
            }

            unobserve(element: HTMLElement) {
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
        intersect: (visibility: Record<string, boolean>) =>
            live().forEach((observer) =>
                observer.callback(
                    [...observer.elements].map((target) => ({ target, isIntersecting: Boolean(visibility[target.dataset.scrollkey ?? '']), boundingClientRect: { y: 0 } }) as unknown as IntersectionObserverEntry),
                    observer as unknown as IntersectionObserver
                )
            ),
    };
}

describe('Tabs more 与 collapsible', () => {
    const scrollIntoView = vi.fn<Element['scrollIntoView']>();
    const keyPanes = (keys: string[]): PaneData[] => keys.map((key) => ({ itemKey: key, tab: `tab-${key}` }));
    const arrow = (container: HTMLElement, pos: string) => container.querySelector(`.${prefix}-bar-arrow-${pos}`) as HTMLElement;
    const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');

    afterEach(() => {
        scrollIntoView.mockReset();
        vi.unstubAllGlobals();
        delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    const mockScroll = () => {
        Element.prototype.scrollIntoView = scrollIntoView;
        return scrollIntoView;
    };

    it('more：最后的标签收进下拉菜单，可按数量或自定义触发器展示', async () => {
        const onChange = vi.fn<Change>();
        const { unmount } = renderTabs({ more: 1, onChange });
        expect(tabNames()).toEqual(['A', 'B']);
        expect(screen.getByText('更多')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).not.toContainElement(screen.getByText('更多'));
        unmount();

        renderTabs({ more: { count: 2, dropdownProps: { trigger: 'click' } }, onChange });
        expect(tabNames()).toEqual(['A']);
        await userEvent.click(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items.map((item) => item.textContent)).toEqual(['B', 'C']);
        await userEvent.click(items[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
    });

    it('more：默认触发器是 button，Tab 聚焦，Enter 或 Space 打开', async () => {
        renderTabs({ more: 2 });
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
        renderTabs({ more: 2 });
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.keyboard(' ');
        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(2);
    });

    it('more：自定义渲染替换触发器，错误的格式会抛出异常', () => {
        const { unmount } = renderTabs({ more: { count: 5, render: () => <span>custom more</span> } });
        expect(screen.getByText('custom more')).toBeInTheDocument();
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
        unmount();
        // a string is not a valid `more`; the runtime must reject it
        const invalidMore = { more: 'many' } as unknown as TabsProps;
        expect(() => renderTabs(invalidMore)).toThrow('[Semi Tabs]: invalid tab props format: more');
    });

    it('more：菜单中的禁用页签不能被点选', async () => {
        const onChange = vi.fn<Change>();
        renderTabs({ more: 2, onChange }, [...threePanes.slice(0, 2), { ...threePanes[2], disabled: true }]);
        await userEvent.hover(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('A');
    });

    it('more 菜单渲染节点形式的页签名称', async () => {
        renderTabs({ more: { count: 1, dropdownProps: { trigger: 'click' } } }, [threePanes[0], { ...threePanes[1], tab: <b>rich-b</b> }]);
        await userEvent.click(screen.getByText('更多'));
        const items = await screen.findAllByRole('menuitemcheckbox');
        expect(items[0]).toHaveTextContent('rich-b');
    });

    it('more 菜单的图标在菜单项的图标位，箭头菜单的图标在标题之前', async () => {
        mockScroll();
        const io = stubIntersectionObserver();
        const iconPanes = threePanes.map((pane) => ({ ...pane, icon: <i data-testid={`icon-${pane.itemKey}`} /> }));
        const { unmount } = renderTabs({ more: { count: 1, dropdownProps: { trigger: 'click' } } }, iconPanes);
        await userEvent.click(screen.getByText('更多'));
        await screen.findAllByRole('menuitemcheckbox');
        expect(screen.getByTestId('icon-c').parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-dropdown-item-icon`);
        unmount();

        renderTabs({ collapsible: true, dropdownProps: { end: { trigger: 'click' } } }, iconPanes);
        io.intersect({ 'a-bar': true });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }));
        const [item] = await screen.findAllByRole('menuitemcheckbox');
        const icon = item.querySelector('[data-testid="icon-b"]') as HTMLElement;
        expect(icon.parentElement?.tagName).toBe('SPAN');
        expect(icon.parentElement).not.toHaveClass(`${BASE_CLASS_PREFIX}-dropdown-item-icon`);
    });

    it('tabList 的 renderTab、renderIcon 在页签、more 菜单与隐藏名称处各自创建内容，打开菜单后标签与面板名称不变', async () => {
        render(() => (
            <Tabs
                more={1}
                defaultActiveKey="b"
                tabList={[
                    { itemKey: 'a', tab: 'A' },
                    { itemKey: 'b', tab: 'B' },
                ]}
                renderTab={(item, index) => <b>{`${item.tab}${index}`}</b>}
                renderIcon={(item) => <i data-testid={`icon-${item.itemKey}`} />}
            >
                content
            </Tabs>
        ));
        expect(tab('A0').querySelector('b')).toHaveTextContent('A0');
        expect(within(tab('A0')).getByTestId('icon-a')).toBeInTheDocument();
        expect(screen.getByRole('tabpanel', { name: 'B1' })).toHaveTextContent('content');
        await userEvent.hover(screen.getByText('更多'));
        const [item] = await screen.findAllByRole('menuitemcheckbox');
        expect(item.querySelector('b')).toHaveTextContent('B1');
        expect(within(item).getByTestId('icon-b')).toBeInTheDocument();
        expect(screen.getByRole('tabpanel', { name: 'B1' })).toHaveTextContent('content');
        expect(tabNames()).toEqual(['A0']);
    });

    it('more：选中页签收进菜单时，tablist 内第一个可用页签是唯一的 Tab 停靠点', () => {
        const { unmount } = renderTabs({ more: 2, defaultActiveKey: 'c' });
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
        unmount();

        renderTabs({ more: 1, defaultActiveKey: 'c' }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]);
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
    });

    it('more：选中页签在可见范围内时仍由它停靠', () => {
        renderTabs({ more: 1, defaultActiveKey: 'b' });
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
    });

    it('more：count 为 0 的对象与 more={0} 一样不渲染「更多」触发器', () => {
        renderTabs({ more: { count: 0 } });
        expect(tabNames()).toEqual(['A', 'B', 'C']);
        expect(screen.queryByRole('button', { name: zh_CN.Tabs.more })).toBeNull();
    });

    it('collapsible：隐藏的标签进入箭头下拉菜单，选中后滚动到可见区域', async () => {
        mockScroll();
        const io = stubIntersectionObserver();
        const onVisibleTabsChange = vi.fn<NonNullable<TabsProps['onVisibleTabsChange']>>();
        const onChange = vi.fn<Change>();
        const panes = keyPanes(['k0', 'k1', 'k2', 'k3', 'k4']);
        const { container } = renderTabs({ collapsible: true, onVisibleTabsChange, onChange, visibleTabsStyle: { color: 'red' }, dropdownProps: { end: { trigger: 'click' } } }, panes);
        const arrowButton = (pos: string) => arrow(container, pos).querySelector('button') as HTMLButtonElement;
        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
        expect(screen.getByRole('tablist')).toBe(container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`));
        expect(screen.getByRole('tablist')).not.toContainElement(arrow(container, 'start'));
        expect(screen.getByRole('tablist')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(io.observed().map((node) => node.dataset.scrollkey)).toEqual(panes.map((p) => `${p.itemKey}-bar`));
        expect(arrowButton('start')).toBeDisabled();
        expect(arrowButton('end')).toBeDisabled();

        io.intersect({ 'k0-bar': true, 'k1-bar': true });
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

    it('collapsible：选中页签时标签节点不重建，焦点保留在页签上', async () => {
        mockScroll();
        stubIntersectionObserver();
        renderTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        const k1 = tab('tab-k1');
        k1.focus();
        await userEvent.keyboard('{Enter}');
        expect(selectedTab()).toBe('tab-k1');
        expect(tab('tab-k1')).toBe(k1);
        expect(k1).toHaveFocus();
    });

    it('collapsible：使用方展开信号对象时，无关属性变化不重建箭头与标签', () => {
        mockScroll();
        stubIntersectionObserver();
        const [p, setP] = createSignal<TabsProps>({ collapsible: true });
        render(() => (
            <Tabs {...p()}>
                <For each={keyPanes(['k0', 'k1', 'k2'])}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        const next = screen.getByRole('button', { name: zh_CN.Tabs.nextTabs });
        const k1 = tab('tab-k1');
        setP((prev) => ({ ...prev, class: 'other' }));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBe(next);
        expect(tab('tab-k1')).toBe(k1);
    });

    it('collapsible：箭头按钮上按 Enter 和 Space 每次滚动一个标签', async () => {
        mockScroll();
        const io = stubIntersectionObserver();
        renderTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2', 'k3', 'k4']));
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }).focus();
        scrollIntoView.mockClear();

        await userEvent.keyboard('{Enter}');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
        await userEvent.keyboard(' ');
        expect(scrollIntoView).toHaveBeenCalledTimes(2);
        expect(scrollIntoView.mock.contexts[1]).toBe(tab('tab-k3'));
    });

    it('collapsible：两个箭头按钮（无论是否禁用）都有可访问名称', () => {
        mockScroll();
        const io = stubIntersectionObserver();
        renderTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeDisabled();
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        expect(screen.getByRole('button', { name: zh_CN.Tabs.prevTabs })).toBeDisabled();
        expect(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs })).toBeEnabled();
    });

    it('collapsible="auto"：观察到标签栏溢出时折叠', () => {
        stubIntersectionObserver();
        const ro = mockResizeObserver();
        renderTabs({ collapsible: 'auto' });
        const bar = getBar();
        expect(ro.observed()).toContain(bar);
        expect(bar).not.toHaveClass(`${prefix}-bar-collapse`);

        Object.defineProperty(bar, 'scrollWidth', { configurable: true, value: 300 });
        Object.defineProperty(bar, 'clientWidth', { configurable: true, value: 100 });
        ro.fire(bar, [{ target: bar }]);

        expect(getBar()).toHaveClass(`${prefix}-bar-collapse`);
    });

    it('TabPane 写法：list 与 renderArrow 的 items 是不带 tab 的普通数据，节点内容照常显示', () => {
        mockScroll();
        const io = stubIntersectionObserver();
        let list: PlainTab[] = [];
        const renderArrow = vi.fn<NonNullable<TabsProps['renderArrow']>>((_items, _pos, _click, defaultNode) => defaultNode());
        render(() => (
            <Tabs
                collapsible
                renderArrow={renderArrow}
                renderTabBar={(barProps, DefaultTabBar) => {
                    list = barProps.list ?? [];
                    return <DefaultTabBar {...barProps} />;
                }}
            >
                <TabPane itemKey="t" tab="text" disabled>
                    T
                </TabPane>
                <TabPane itemKey="n" tab={<b>node</b>} closable>
                    N
                </TabPane>
            </Tabs>
        ));
        io.intersect({ 't-bar': true });
        const plain = (item: object) => Object.values(Object.getOwnPropertyDescriptors(item)).every((descriptor) => !descriptor.get);
        expect(list.map((item) => ({ ...item }))).toEqual([
            { itemKey: 't', disabled: true, closable: undefined },
            { itemKey: 'n', disabled: undefined, closable: true },
        ]);
        expect(list.some((item) => 'tab' in item)).toBe(false);
        expect(list.every(plain)).toBe(true);
        expect(renderArrow.mock.lastCall?.[0].every(plain)).toBe(true);
        expect(tab('node')).toHaveTextContent('node');
    });

    it('collapsible：renderArrow、arrowPosition 和 showRestInDropdown={false}', async () => {
        mockScroll();
        const io = stubIntersectionObserver();
        const renderArrow = vi.fn<NonNullable<TabsProps['renderArrow']>>((items, pos, _handleArrowClick, defaultNode) => (
            <span class={`custom-${pos}`}>
                {items.length}
                {defaultNode()}
            </span>
        ));
        const { container } = renderTabs({ collapsible: true, renderArrow, arrowPosition: 'end', showRestInDropdown: false }, keyPanes(['k0', 'k1', 'k2']));
        io.intersect({ 'k0-bar': true });
        const list = container.querySelector(`.${BASE_CLASS_PREFIX}-overflow-list`) as HTMLElement;
        expect(list.firstElementChild).toHaveClass(`${BASE_CLASS_PREFIX}-overflow-list-scroll-wrapper`);
        expect(container.querySelector('.custom-start')).toHaveTextContent(/^0$/);
        expect(container.querySelector('.custom-end')).toHaveTextContent(/^2$/);
        expect(renderArrow.mock.lastCall?.[1]).toBe('end');
        await userEvent.click(container.querySelector(`.custom-end .${prefix}-bar-arrow`) as HTMLElement);
        expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-k1'));
    });

    it('collapsible：受控的 activeKey 变化时滚动使标签可见', () => {
        mockScroll();
        stubIntersectionObserver();
        const [activeKey, setActiveKey] = createSignal('k0');
        render(() => (
            <Tabs collapsible activeKey={activeKey()}>
                <For each={keyPanes(['k0', 'k1', 'k2'])}>{(pane) => <TabPane {...pane} />}</For>
            </Tabs>
        ));
        expect(scrollIntoView).not.toHaveBeenCalled();
        setActiveKey('k2');
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.contexts[0]).toBe(tab('tab-k2'));
    });

    it('collapsible：itemKey 含双引号与空格时切换不抛错，标签与面板的 id 一一对应', () => {
        mockScroll();
        stubIntersectionObserver();
        const [activeKey, setActiveKey] = createSignal('a "b"');
        render(() => (
            <Tabs collapsible activeKey={activeKey()}>
                <For each={['a "b"', 'c d']}>{(key) => <TabPane itemKey={key} tab={`tab-${key}`} children={key} />}</For>
            </Tabs>
        ));
        expect(() => setActiveKey('c d')).not.toThrow();
        expect(scrollIntoView.mock.contexts.at(-1)).toBe(tab('tab-c d'));
        const panels = screen.getAllByRole('tabpanel', { hidden: true });
        screen.getAllByRole('tab').forEach((item, i) => {
            // an id holding a space would be read as two IDREFs
            expect(item.id).not.toMatch(/\s/);
            expect(panels[i].id).not.toMatch(/\s/);
            expect(item.getAttribute('aria-controls')).toBe(panels[i].id);
            expect(panels[i].getAttribute('aria-labelledby')).toBe(item.id);
        });
    });

    it('collapsible：箭头菜单中的禁用页签不能被点选', async () => {
        mockScroll();
        const io = stubIntersectionObserver();
        const onChange = vi.fn<Change>();
        renderTabs(
            { collapsible: true, onChange },
            ['k0', 'k1', 'k2', 'k3'].map((key) => ({ itemKey: key, tab: `tab-${key}`, disabled: key === 'k3' }))
        );
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Tabs.nextTabs }));
        const items = await screen.findAllByRole('menuitemcheckbox');
        await userEvent.click(items[1]);
        expect(onChange).not.toHaveBeenCalled();
        expect(selectedTab()).toBe('tab-k0');
    });

    it('collapsible：dropdownProps 的 class 追加到内置弹层类名之后', async () => {
        mockScroll();
        const io = stubIntersectionObserver();
        const { container } = renderTabs({ collapsible: true, dropdownProps: { end: { trigger: 'click', class: 'x' } } }, keyPanes(['k0', 'k1', 'k2', 'k3']));
        io.intersect({ 'k0-bar': true, 'k1-bar': true });
        await userEvent.click(container.querySelector(`.${prefix}-bar-arrow-end button`) as HTMLElement);
        const popup = (await screen.findAllByRole('menuitemcheckbox'))[0].closest(`.${prefix}-bar-dropdown`);
        expect(popup).toHaveClass('x');
    });

    it('collapsible：带下拉菜单的箭头外层容器不是 Tab 停靠点，悬停菜单既不描述它，也不将其标记为 menu button', () => {
        mockScroll();
        const io = stubIntersectionObserver();
        const { container } = renderTabs({ collapsible: true }, keyPanes(['k0', 'k1', 'k2']));
        io.intersect({ 'k0-bar': true });
        const end = arrow(container, 'end');
        expect(end.querySelector('button')).toBeEnabled();
        expect(end).toHaveAttribute('tabindex', '-1');
        for (const node of [end, end.querySelector('button')]) {
            expect(node).not.toHaveAttribute('aria-describedby');
            expect(node).not.toHaveAttribute('aria-haspopup');
            expect(node).not.toHaveAttribute('aria-expanded');
        }
    });
});

describe('Tabs 键盘与命名', () => {
    const tabStops = () => screen.getAllByRole('tab').filter((item) => item.getAttribute('tabindex') === '0');

    it('activeKey 为 null 或不命中任何页签时，第一个启用的页签是唯一的 Tab 停靠点', () => {
        const first = renderTabs({ activeKey: null }, [{ ...threePanes[0], disabled: true }, threePanes[1], threePanes[2]]);
        expect(tabStops().map((item) => item.textContent)).toEqual(['B']);
        first.unmount();

        const second = renderTabs({ defaultActiveKey: 'missing' });
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
        second.unmount();

        render(() => (
            <Tabs activeKey={null} renderTabBar={(bar) => <div role="tablist">{<For each={bar.list}>{(pane) => <TabItem itemKey={pane.itemKey} tab={pane.itemKey.toUpperCase()} />}</For>}</div>}>
                <TabPane itemKey="a" tab="A" />
                <TabPane itemKey="b" tab="B" />
            </Tabs>
        ));
        expect(tabStops().map((item) => item.textContent)).toEqual(['A']);
    });

    it('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动焦点也不选中', () => {
        const onChange = vi.fn<Change>();
        renderTabs({ onChange });
        tab('B').focus();
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            for (const key of ['ArrowRight', 'Home', 'Enter']) {
                expect(fireEvent.keyDown(tab('B'), { key, [modifier]: true })).toBe(true);
                expect(tab('B')).toHaveFocus();
            }
        }
        expect(onChange).not.toHaveBeenCalled();
    });

    it('more：选中的页签收进菜单时，面板仍以该页签的名称命名', () => {
        const { unmount } = renderTabs({ more: 2, defaultActiveKey: 'c' });
        expect(screen.getByRole('tabpanel', { name: 'C' })).toBeInTheDocument();
        unmount();

        render(() => (
            <Tabs
                more={1}
                defaultActiveKey="b"
                tabList={[
                    { itemKey: 'a', tab: 'A' },
                    { itemKey: 'b', tab: 'B' },
                ]}
            >
                content
            </Tabs>
        ));
        expect(screen.getByRole('tabpanel', { name: 'B' })).toHaveTextContent('content');
    });

    it('more：标题为节点时打开菜单，面板名称不变', async () => {
        render(() => (
            <Tabs more={2} defaultActiveKey="c">
                <TabPane itemKey="a" tab={<span>A</span>} />
                <TabPane itemKey="b" tab={<span>B</span>} />
                <TabPane itemKey="c" tab={<span>C</span>} />
            </Tabs>
        ));
        await userEvent.hover(screen.getByText('更多'));
        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(2);
        expect(screen.getByRole('tabpanel', { name: 'C' })).toBeInTheDocument();
    });
});
