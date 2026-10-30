import { children, createMemo, createSignal, createUniqueId, For, Show, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, getPanelId, getTabId } from '@fibrae/semi-foundation/tabs/constants';
import TabsFoundation, { type MotionView, type TabsAdapter } from '@fibrae/semi-foundation/tabs/foundation';
import '@fibrae/semi-foundation/tabs/tabs.scss';
import { isToken, type Token } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import { type TabsContextValue, TabsContext } from './context';
import type { PlainTab, TabBarProps, TabPaneProps, TabRender, TabsProps } from './interface';
import TabBar from './tab-bar';
import { TAB_PANE } from './tab-pane';

export interface TabsState {
    activeKey: string | null;
}

type Foundation = TabsFoundation<TabsProps, TabsState, MouseEvent | KeyboardEvent>;
type Adapter = TabsAdapter<TabsProps, TabsState, MouseEvent | KeyboardEvent>;

const defaultProps = {
    collapsible: false,
    keepDOM: true,
    lazyRender: false,
    size: 'large',
    tabPaneMotion: true,
    tabPosition: 'top',
    type: 'line',
    showRestInDropdown: true,
    arrowPosition: 'both',
} satisfies Partial<TabsProps>;

const isPane = (node: unknown): node is Token<TabPaneProps> => isToken<TabPaneProps>(node, TAB_PANE);

export default function Tabs(rawProps: TabsProps) {
    const props = useDefaultProps('Tabs', rawProps, defaultProps);

    const [local, named, rest] = splitProps(
        props,
        [
            'activeKey',
            'arrowPosition',
            'children',
            'class',
            'collapsible',
            'contentStyle',
            'defaultActiveKey',
            'dropdownProps',
            'keepDOM',
            'lazyRender',
            'more',
            'onChange',
            'onTabClick',
            'onTabClose',
            'onVisibleTabsChange',
            'preventScroll',
            'renderArrow',
            'renderIcon',
            'renderTab',
            'renderTabBar',
            'showRestInDropdown',
            'size',
            'tabBarClassName',
            'tabBarExtraContent',
            'tabBarStyle',
            'tabList',
            'tabPaneMotion',
            'tabPosition',
            'type',
            'visibleTabsStyle',
        ],
        ['aria-label', 'aria-labelledby']
    );

    const config = useConfig();

    // itemKeys repeat across Tabs on one page, so tab and panel ids are scoped by this per-instance id
    const tabsId = `${cssClasses.TABS}-${createUniqueId()}`;
    const resolved = children(() => local.children);
    const tokens = createMemo(() => resolved.toArray().flatMap((node) => (isPane(node) ? [node] : [])));

    // an entry equal to one of the previous list keeps that object, so fresh objects with the same data do not run
    // renderTab again and the tab keeps its content and focus
    const tabList = createMemo((previous?: PlainTab[]) => local.tabList?.map((item) => previous?.find((old) => isEqual(old, item)) ?? item));

    // A TabPane's `tab` is JSX, and reading it for a check creates a node the server markup does not have, which breaks
    // hydration. The data never carries it; the bar creates it through renderTab where it is inserted.
    const panePlain = createMemo((previous?: PlainTab[]) =>
        tokens().map(({ props }) => {
            const item: PlainTab = { itemKey: props.itemKey as string, disabled: props.disabled, closable: props.closable };
            return previous?.find((old) => isEqual(old, item)) ?? item;
        })
    );

    const panes = createMemo(() => tabList() ?? panePlain());

    // a (possibly empty) tabList switches the children to plain content; a memo, so a fresh tabList does not run the
    // renderTab readers again
    const isTabListMode = createMemo(() => Array.isArray(local.tabList));

    const { foundation, state } = useFoundation<Foundation, Adapter, TabsProps, TabsState>(
        TabsFoundation,
        props,
        // tokens resolve synchronously on first read, so the default key sees the panes in the first render
        (view) => ({ activeKey: TabsFoundation.getDefaultActiveKey(view, panes()) }),
        (base) => ({
            notifyTabClick: (key, event) => base.getProps().onTabClick?.(key, event),
            notifyChange: (key) => base.getProps().onChange?.(key),
            setNewActiveKey: (key) => base.setState({ activeKey: key }),
            notifyTabDelete: (key) => base.getProps().onTabClose?.(key),
        }),
        // direction: RTL swaps ArrowLeft and ArrowRight
        { context: config }
    );

    const paneKeys = createMemo(() => panes().map((pane) => pane.itemKey as string | undefined), undefined, { equals: isEqual });

    const activeKey = () => (local.activeKey === undefined ? state().activeKey : local.activeKey);

    const content = createMemo(() => resolved.toArray().filter((node) => local.keepDOM || !isPane(node) || node.props.itemKey === activeKey()));

    // with tabList there is no TabPane, so the content area is the single panel of the active tab, if there is one
    const tabListPanel = createMemo(() => {
        const key = activeKey();
        return isTabListMode() && key !== null && panes().some((pane) => pane.itemKey === key) ? { id: getPanelId(tabsId, key), labelledby: getTabId(tabsId, key) } : undefined;
    });

    const motion = createMemo((prev?: MotionView) => TabsFoundation.getMotionView(prev, { activeKey: activeKey(), propsActiveKey: local.activeKey, paneKeys: paneKeys() }));

    const view = createMemo(() => ({
        tabsId,
        everyPanelMounted: !isTabListMode() && local.keepDOM,
        type: local.type,
        tabPosition: local.tabPosition,
        tabbableKey: TabsFoundation.getTabbableKey(panes(), activeKey()),
    }));

    // the pane's tab and icon are read where the bar inserts them, so each place gets its own node
    const paneProps = (item: PlainTab) => tokens().find((token) => token.props.itemKey === item.itemKey)?.props;

    const paneTab: TabRender = (item) => paneProps(item)?.tab;

    const paneIcon: TabRender = (item) => paneProps(item)?.icon;

    const deleteTabItem = (tabKey: string, event: MouseEvent) => {
        event.stopPropagation();
        foundation.handleTabDelete(tabKey);
    };

    const context: TabsContextValue = { view, deleteTabItem, handleKeyDown: foundation.handleKeyDown };

    const tabBarProps: TabBarProps = {
        get activeKey() {
            return activeKey();
        },
        get list() {
            return panes();
        },
        get class() {
            return local.tabBarClassName;
        },
        get style() {
            return local.tabBarStyle;
        },
        get size() {
            return local.size;
        },
        get type() {
            return local.type;
        },
        get tabPosition() {
            return local.tabPosition;
        },
        get tabBarExtraContent() {
            return local.tabBarExtraContent;
        },
        get 'aria-label'() {
            return named['aria-label'];
        },
        get 'aria-labelledby'() {
            return named['aria-labelledby'];
        },
        get collapsible() {
            return local.collapsible;
        },
        get showRestInDropdown() {
            return local.showRestInDropdown;
        },
        get more() {
            return local.more;
        },
        get onVisibleTabsChange() {
            return local.onVisibleTabsChange;
        },
        get visibleTabsStyle() {
            return local.visibleTabsStyle;
        },
        get arrowPosition() {
            return local.arrowPosition;
        },
        get renderArrow() {
            return local.renderArrow;
        },
        get dropdownProps() {
            return local.dropdownProps;
        },
        get renderTab() {
            return isTabListMode() ? local.renderTab : paneTab;
        },
        get renderIcon() {
            return isTabListMode() ? local.renderIcon : paneIcon;
        },
        onTabClick: foundation.handleTabClick,
        deleteTabItem,
        handleKeyDown: foundation.handleKeyDown,
    };

    // called only from the For callback, so the For item owns the pane and everything it renders
    const renderPane = (token: Token<TabPaneProps>) => {
        const [pane, paneRest] = splitProps(token.props, ['children', 'class', 'closable', 'disabled', 'icon', 'itemKey', 'tab', 'tabIndex']);
        const key = () => pane.itemKey ?? '';
        const active = () => activeKey() === pane.itemKey;
        // latches without a write: once activated, a lazily rendered pane keeps its content
        const activated = createMemo((was: boolean) => was || active(), false);
        // compared by value, so the effect below runs only when the class or the decision changes, as Vue's watch on computed does
        const paneMotion = createMemo(
            () =>
                TabsFoundation.getPaneMotion({
                    itemKey: pane.itemKey,
                    activeKey: activeKey(),
                    prevActiveKey: motion().prevActiveKey,
                    paneKeys: paneKeys(),
                    tabPosition: local.tabPosition,
                    tabPaneMotion: local.tabPaneMotion,
                    forceDisableMotion: motion().forceDisableMotion,
                }),
            undefined,
            { equals: (a, b) => a.startClassName === b.startClassName && a.hasMotion === b.hasMotion }
        );
        // a pane mounted by keepDOM={false} on a switch starts with the slide, as React's CSSAnimation does on mount
        const [animating, setAnimating] = createSignal(untrack(paneMotion).hasMotion);

        useWatch(paneMotion, ({ hasMotion }) => setAnimating(hasMotion));

        return (
            <div
                {...paneRest}
                id={getPanelId(tabsId, key())}
                class={clsx(pane.class, cssClasses.TABS_PANE, active() ? cssClasses.TABS_PANE_ACTIVE : cssClasses.TABS_PANE_INACTIVE)}
                aria-hidden={active() ? 'false' : 'true'}
                aria-labelledby={getTabId(tabsId, key())}
                role="tabpanel"
                tabIndex={pane.tabIndex ?? 0}
                x-semi-prop="children"
            >
                {/* animationend bubbles, and one from the pane's content must not end the overlay's slide */}
                <div
                    class={clsx(cssClasses.TABS_PANE_MOTION_OVERLAY, animating() && paneMotion().startClassName)}
                    x-semi-prop="children"
                    onAnimationEnd={(event) => {
                        if (event.target === event.currentTarget) {
                            setAnimating(false);
                        }
                    }}
                >
                    <Show when={!local.lazyRender || activated()}>{pane.children}</Show>
                </div>
            </div>
        );
    };

    useWatch(() => local.activeKey, foundation.syncActiveKey);

    // panes can leave after mount: an uncontrolled key no longer among them moves to the first enabled one
    useWatch(paneKeys, () => foundation.handleTabPanesChange(panes()));

    return (
        <div {...rest} class={clsx(local.class, cssClasses.TABS, `${cssClasses.TABS}-${local.tabPosition}`)}>
            {/* the tab bar is inside the provider so that TabItems, including ones from renderTabBar, read tabsId */}
            <TabsContext.Provider value={context}>
                {/* Show runs the callback untracked: renderTabBar is called once per function, and only reads inside its JSX track */}
                <Show keyed when={local.renderTabBar} fallback={<TabBar {...tabBarProps} />}>
                    {(renderTabBar) => renderTabBar(tabBarProps, TabBar)}
                </Show>
                <div class={clsx(cssClasses.TABS_CONTENT, `${cssClasses.TABS_CONTENT}-${local.tabPosition}`)} style={local.contentStyle} role={tabListPanel() ? 'tabpanel' : undefined} id={tabListPanel()?.id} aria-labelledby={tabListPanel()?.labelledby}>
                    <Show when={!isTabListMode()} fallback={resolved.toArray().filter((node) => !isPane(node))}>
                        <For each={content()}>{(node) => (isPane(node) ? renderPane(node) : node)}</For>
                    </Show>
                </div>
            </TabsContext.Provider>
        </div>
    );
}
