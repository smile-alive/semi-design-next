<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, getPanelId, getTabId } from '@fibrae/semi-foundation/tabs/constants';
    import TabsFoundation, { type MotionView, type TabsAdapter, type TabsBaseProps, type TabsBaseState } from '@fibrae/semi-foundation/tabs/foundation';
    import '@fibrae/semi-foundation/tabs/tabs.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import { setTabsContext, type TabsView } from './context.js';
    import type { TabBarProps, TabsProps } from './interface.js';
    import TabBar from './tab-bar.svelte';
    import TabPane from './tab-pane.svelte';

    type Foundation = TabsFoundation<TabsBaseProps, TabsBaseState, MouseEvent | KeyboardEvent>;
    type Adapter = TabsAdapter<TabsBaseProps, TabsBaseState, MouseEvent | KeyboardEvent>;

    const defaults = useDefaultProps('Tabs');

    // aria-label and aria-labelledby name the tablist; a generic root cannot be named (ARIA 1.2).
    // No fallback on `activeKey`: a bound `undefined` (back to uncontrolled) would throw with one.
    let {
        activeKey = $bindable(),
        arrowPosition = defaults('arrowPosition', 'both'),
        collapsible = defaults('collapsible', false),
        contentStyle = defaults('contentStyle'),
        dropdownProps = defaults('dropdownProps'),
        keepDOM = defaults('keepDOM', true),
        lazyRender = defaults('lazyRender', false),
        more = defaults('more'),
        preventScroll = defaults('preventScroll'),
        showRestInDropdown = defaults('showRestInDropdown', true),
        size = defaults('size', 'large'),
        tabBarClassName = defaults('tabBarClassName'),
        tabBarStyle = defaults('tabBarStyle'),
        tabList = defaults('tabList', []),
        tabPaneMotion = defaults('tabPaneMotion', true),
        tabPosition = defaults('tabPosition', 'top'),
        type = defaults('type', 'line'),
        visibleTabsStyle = defaults('visibleTabsStyle'),
        onChange,
        onTabClick,
        onTabClose,
        onVisibleTabsChange,
        children,
        panel,
        tab,
        icon,
        tabBarExtraContent,
        tabBar,
        arrow,
        moreTrigger,
        moreContent,
        ...rest
    }: TabsProps = $props();

    const config = getConfigContext();

    // itemKeys repeat across Tabs on a page, so ids are scoped per instance
    const uid = $props.id();

    // The key this component last wrote to `activeKey` itself. A prop equal to it is the component's own state (what an
    // unbound or bound Tabs keeps after a click); any other defined value was set by the parent and controls the tabs.
    let written: string | null | undefined;

    let motion = $state.raw<MotionView>(
        untrack(() =>
            TabsFoundation.getMotionView(undefined, {
                activeKey: TabsFoundation.getDefaultActiveKey({ activeKey }, tabList),
                propsActiveKey: activeKey,
                paneKeys: tabList.map((item) => item.itemKey),
            })
        )
    );

    const tabsId = `${cssClasses.TABS}-${uid}`;
    const controlledKey = $derived(activeKey === written ? undefined : activeKey);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: TabsBaseProps = {
        get activeKey() {
            return controlledKey;
        },
        get tabPosition() {
            return tabPosition;
        },
        get preventScroll() {
            return preventScroll;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, TabsBaseProps, TabsBaseState>(
        TabsFoundation,
        foundationProps,
        (view) => ({ activeKey: TabsFoundation.getDefaultActiveKey(view, tabList) }),
        (base) => ({
            notifyTabClick: (key, event) => onTabClick?.(key, event),
            notifyChange: (next) => {
                written = next;
                activeKey = next;
                onChange?.(next);
            },
            setNewActiveKey: (next) => base.setState({ activeKey: next }),
            notifyTabDelete: (key) => onTabClose?.(key),
        }),
        { context: () => config }
    );

    const current = $derived(controlledKey === undefined ? states().activeKey : controlledKey);
    const paneKeys = $derived(tabList.map((item) => item.itemKey));

    // primitive, so the watcher below runs only when the keys themselves change
    const paneSignature = $derived(JSON.stringify(paneKeys));
    const attrs = $derived(splitControlAttrs(rest, (key) => key === 'aria-label' || key === 'aria-labelledby'));

    const view = $derived<TabsView>({
        activeKey: current,
        prevActiveKey: motion.prevActiveKey,
        forceDisableMotion: motion.forceDisableMotion,
        paneKeys,
        lazyRender,
        tabPaneMotion,
        tabPosition,
        type,
        size,
        tabsId,
        everyPanelMounted: Boolean(panel) && keepDOM,
        tabbableKey: TabsFoundation.getTabbableKey(tabList, current),
    });

    const barProps = $derived<TabBarProps>({
        activeKey: current,
        list: tabList,
        type,
        size,
        tabPosition,
        collapsible,
        showRestInDropdown,
        more,
        arrowPosition,
        visibleTabsStyle,
        dropdownProps,
        class: tabBarClassName,
        style: tabBarStyle,
    });

    // Without `panel` the content area is the single panel; without a matching tab it has nothing to be labelled by
    const contentPanelAttrs = $derived(!panel && current !== null && tabList.some((item) => item.itemKey === current) ? { role: 'tabpanel', id: getPanelId(tabsId, current), 'aria-labelledby': getTabId(tabsId, current) } : {});

    setTabsContext({
        get view() {
            return view;
        },
        tabClick: foundation.handleTabClick,
        handleKeyDown: foundation.handleKeyDown,
        deleteTab: foundation.handleTabDelete,
    });

    // the motion needs the previous view, so it is derived before the DOM shows the new key
    $effect.pre(() => {
        const input = { activeKey: current, propsActiveKey: controlledKey, paneKeys };
        untrack(() => {
            motion = TabsFoundation.getMotionView(motion, input);
        });
    });

    watch(() => activeKey, foundation.syncActiveKey);

    watch(
        () => paneSignature,
        () => foundation.handleTabPanesChange(tabList)
    );
</script>

{#snippet defaultBar()}
    <TabBar {...barProps} {arrow} extra={tabBarExtraContent} {icon} {moreContent} {moreTrigger} {onVisibleTabsChange} {tab} tablistAttrs={attrs.control} />
{/snippet}

<div {...attrs.root} class={[cssClasses.TABS, `${cssClasses.TABS}-${tabPosition}`, rest.class]}>
    {#if tabBar}
        {@render tabBar({ tabBar: defaultBar, tabBarProps: barProps })}
    {:else}
        {@render defaultBar()}
    {/if}
    <div {...contentPanelAttrs} class={[cssClasses.TABS_CONTENT, `${cssClasses.TABS_CONTENT}-${tabPosition}`]} style={contentStyle}>
        {#if panel}
            {#each tabList as item, index (item.itemKey)}
                {#if keepDOM || item.itemKey === current}
                    <TabPane itemKey={item.itemKey}>
                        {@render panel({ itemKey: item.itemKey, item, index })}
                    </TabPane>
                {/if}
            {/each}
        {:else}
            {@render children?.()}
        {/if}
    </div>
</div>
