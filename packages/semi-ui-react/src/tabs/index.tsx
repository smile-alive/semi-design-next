import { type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode, useCallback, useId, useMemo, useState } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/tabs/constants';
import TabsFoundation, { type TabsAdapter } from '@fibrae/semi-foundation/tabs/foundation';
import '@fibrae/semi-foundation/tabs/tabs.scss';
import elementTypeOf from '../_base/element-type';
import flattenChildren from '../_base/flatten-children';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import { getPanelId, getTabId } from './ids';
import type { PlainTab, TabBarProps, TabPaneProps, TabsProps } from './interface';
import TabBar from './tab-bar';
import TabItem from './tab-item';
import TabPane from './tab-pane';
import { TabsContext } from './tabs-context';

export * from './interface';

type TabClickEvent = MouseEvent | KeyboardEvent;

export interface TabsState {
    activeKey: string | null;
}

const defaultProps = {
    children: [],
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

function isTabPane(child: ReactNode): child is ReactElement<TabPaneProps> {
    return elementTypeOf(child) === 'Tabs.TabPane';
}

// Any other child (text, div) is content, not a tab
function getPanes(tabList: TabsProps['tabList'], children: ReactNode): PlainTab[] {
    // A (possibly empty) tabList switches the children to plain content, so the check is on the array, not its length
    if (Array.isArray(tabList)) {
        return tabList;
    }
    return flattenChildren(children)
        .filter(isTabPane)
        .map(({ props: { tab, icon, disabled, itemKey, closable } }) => ({ tab, icon, disabled, itemKey, closable }));
}

function getActiveItem(children: ReactNode, isTabListMode: boolean, activeKey: string | null): ReactNode {
    if (isTabListMode) {
        return children;
    }
    return flattenChildren(children).filter((pane) => !isTabPane(pane) || pane.props.itemKey === activeKey);
}

function Tabs(rawProps: TabsProps) {
    const props = useDefaultProps('Tabs', rawProps, defaultProps);

    const {
        ref,
        activeKey: propsActiveKey,
        children,
        className,
        collapsible,
        contentStyle,
        defaultActiveKey,
        keepDOM,
        lazyRender,
        onChange,
        onTabClick,
        renderTabBar,
        showRestInDropdown,
        size,
        style,
        tabBarClassName,
        tabBarExtraContent,
        tabBarStyle,
        tabList,
        tabPaneMotion,
        tabPosition,
        type,
        onTabClose,
        preventScroll,
        more,
        onVisibleTabsChange,
        visibleTabsStyle,
        arrowPosition,
        renderArrow,
        dropdownProps,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        ...rest
    } = props;

    const context = useConfigContext();

    const [foundation, state] = useFoundation<TabsFoundation<TabsProps, TabsState, TabClickEvent>, TabsAdapter<TabsProps, TabsState, TabClickEvent>, TabsProps, TabsState>(
        TabsFoundation,
        props,
        () => ({
            activeKey: TabsFoundation.getDefaultActiveKey(props, getPanes(props.tabList, props.children)),
        }),
        (base) => ({
            notifyTabClick: (activeKey, event) => base.getProps().onTabClick?.(activeKey, event),
            notifyChange: (activeKey) => base.getProps().onChange?.(activeKey),
            setNewActiveKey: (activeKey) => base.setState({ activeKey }),
            notifyTabDelete: (tabKey) => base.getProps().onTabClose?.(tabKey),
        }),
        context
    );

    // itemKeys repeat across Tabs on one page, so tab and panel ids are scoped by this per-instance id
    const tabsId = `${cssClasses.TABS}-${useId()}`;
    const activeKey = propsActiveKey === undefined ? state.activeKey : propsActiveKey;
    const isTabListMode = Array.isArray(tabList);

    // kept while tabList and children hold: TabBar re-measures overflow whenever its list changes identity
    const panes = useMemo(() => getPanes(tabList, children), [tabList, children]);
    const childKeys = flattenChildren(children).map((child) => (isTabPane(child) ? child.props.itemKey : undefined));
    const motionInput = { activeKey, propsActiveKey, paneKeys: childKeys };

    const [storedView, setView] = useState(() => TabsFoundation.getMotionView(undefined, motionInput));

    const view = TabsFoundation.getMotionView(storedView, motionInput);

    if (view !== storedView) {
        setView(view);
    }

    const everyPanelMounted = !isTabListMode && keepDOM;
    const tabbableKey = TabsFoundation.getTabbableKey(panes, activeKey);
    const prevActiveKey = view.prevActiveKey;
    const forceDisableMotion = view.forceDisableMotion;
    const content = keepDOM ? children : getActiveItem(children, isTabListMode, activeKey);

    // with tabList there is no TabPane, so the content area is the single panel showing the active tab's content;
    // without a matching tab there is nothing for it to be labelled by
    const tabListPanelProps =
        isTabListMode && panes.some((pane) => pane.itemKey === activeKey)
            ? {
                  role: 'tabpanel',
                  id: getPanelId(tabsId, activeKey),
                  'aria-labelledby': getTabId(tabsId, activeKey),
              }
            : {};

    const handleTabClick = (key: string, event: MouseEvent) => foundation.handleTabClick(key, event);

    const deleteTabItem = useCallback(
        (tabKey: string, event: MouseEvent) => {
            event.stopPropagation();
            foundation.handleTabDelete(tabKey);
        },
        [foundation]
    );

    // stable while its inputs hold, so memoized consumers (TabPane) skip renders that change none of them
    const contextValue = useMemo(
        () => ({
            activeKey,
            lazyRender,
            panes,
            tabPaneMotion,
            tabPosition,
            prevActiveKey,
            forceDisableMotion,
            tabsId,
            everyPanelMounted,
            tabbableKey,
            type,
            deleteTabItem,
            handleKeyDown: foundation.handleKeyDown,
        }),
        [activeKey, lazyRender, panes, tabPaneMotion, tabPosition, prevActiveKey, forceDisableMotion, tabsId, everyPanelMounted, tabbableKey, type, deleteTabItem, foundation]
    );

    const tabBarProps: TabBarProps = {
        activeKey,
        className: tabBarClassName,
        collapsible,
        list: panes,
        onTabClick: handleTabClick,
        showRestInDropdown,
        size,
        style: tabBarStyle,
        tabBarExtraContent,
        tabPosition,
        type,
        deleteTabItem,
        handleKeyDown: foundation.handleKeyDown,
        more,
        onVisibleTabsChange,
        visibleTabsStyle,
        arrowPosition,
        renderArrow,
        dropdownProps,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
    };

    const tabBar = renderTabBar ? renderTabBar(tabBarProps, TabBar) : <TabBar {...tabBarProps} />;

    useDidUpdate(propsActiveKey, (key) => foundation.syncActiveKey(key));

    useDidUpdate(
        childKeys,
        () => {
            if (!isTabListMode) {
                foundation.handleTabPanesChange(panes);
            }
        },
        isEqual
    );

    useDidUpdate(
        panes.map((pane) => pane.itemKey),
        () => {
            if (isTabListMode) {
                foundation.handleTabPanesChange(panes);
            }
        },
        isEqual
    );

    return (
        <div {...rest} ref={ref} className={clsx(className, cssClasses.TABS, { [`${cssClasses.TABS}-${tabPosition}`]: tabPosition })} style={style}>
            {/* the tab bar is inside the provider so that TabItems, including ones from renderTabBar, read tabsId */}
            <TabsContext value={contextValue}>
                {tabBar}
                <div
                    className={clsx(cssClasses.TABS_CONTENT, {
                        [`${cssClasses.TABS_CONTENT}-${tabPosition}`]: tabPosition,
                    })}
                    style={contentStyle}
                    {...tabListPanelProps}
                >
                    {content}
                </div>
            </TabsContext>
        </div>
    );
}

export default Object.assign(Tabs, { TabPane, TabItem });
