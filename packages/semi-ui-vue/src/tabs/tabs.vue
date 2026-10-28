<script setup lang="ts">
    import { computed, h, onMounted, useAttrs, useId, watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/tabs/constants';
    import TabsFoundation, { type MotionView, type TabsAdapter } from '@fibrae/semi-foundation/tabs/foundation';
    import '@fibrae/semi-foundation/tabs/tabs.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useSlotVersion from '../_base/use-slot-version';
    import useConfig from '../config-provider/use-config';
    import { provideTabsContext } from './context';
    import { getPanelId, getTabId } from './ids';
    import type { TabBarProps, TabsEmits, TabsProps, TabsSlots } from './interface';
    import { isTabPane, paneKey, readPanes, type TabEntry } from './read-panes';
    import TabBar from './tab-bar.vue';

    interface TabsState {
        activeKey: string | null;
    }

    type Foundation = TabsFoundation<TabsProps, TabsState, MouseEvent | KeyboardEvent>;
    type Adapter = TabsAdapter<TabsProps, TabsState, MouseEvent | KeyboardEvent>;

    // aria-label and aria-labelledby name the tablist; a generic root cannot be named (ARIA 1.2)
    defineOptions({ name: 'Tabs', inheritAttrs: false });

    const props = withDefaults(defineProps<TabsProps & /* @vue-ignore */ ElementProps<'div', keyof TabsProps | EmitHandlers<TabsEmits>>>(), {
        activeKey: semiGlobalDefault('Tabs', 'activeKey'),
        arrowPosition: () => semiDefault('Tabs', 'arrowPosition', 'both'),
        collapsible: () => semiDefault('Tabs', 'collapsible', false),
        contentStyle: semiGlobalDefault('Tabs', 'contentStyle'),
        defaultActiveKey: semiGlobalDefault('Tabs', 'defaultActiveKey'),
        dropdownProps: semiGlobalDefault('Tabs', 'dropdownProps'),
        keepDOM: () => semiDefault('Tabs', 'keepDOM', true),
        lazyRender: () => semiDefault('Tabs', 'lazyRender', false),
        more: semiGlobalDefault('Tabs', 'more'),
        preventScroll: semiGlobalDefault('Tabs', 'preventScroll'),
        showRestInDropdown: () => semiDefault('Tabs', 'showRestInDropdown', true),
        size: () => semiDefault('Tabs', 'size', 'large'),
        tabBarClassName: semiGlobalDefault('Tabs', 'tabBarClassName'),
        tabBarStyle: semiGlobalDefault('Tabs', 'tabBarStyle'),
        tabList: semiGlobalDefault('Tabs', 'tabList'),
        tabPaneMotion: () => semiDefault('Tabs', 'tabPaneMotion', true),
        tabPosition: () => semiDefault('Tabs', 'tabPosition', 'top'),
        type: () => semiDefault('Tabs', 'type', 'line'),
        visibleTabsStyle: semiGlobalDefault('Tabs', 'visibleTabsStyle'),
    });

    const emit = defineEmits<TabsEmits>();
    const slots = defineSlots<TabsSlots>();
    const attrs = useAttrs();

    const config = useConfig();

    // The slot is read only during render: calling it in setup or a hook warns for h()/JSX slots
    const slotVersion = useSlotVersion(slots);

    // itemKeys repeat across Tabs on a page, so ids are scoped per instance
    const tabsId = `${cssClasses.TABS}-${useId()}`;

    const entries = computed((): TabEntry[] => {
        void slotVersion.value;
        if (!Array.isArray(props.tabList)) {
            return readPanes(slots.default?.() ?? []);
        }
        const { tab, icon } = slots;
        return props.tabList.map((item, index) => ({
            ...item,
            tabSlot: tab && (() => tab({ item, index })),
            iconSlot: icon && (() => icon({ item, index })),
        }));
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, TabsProps, TabsState>(
        TabsFoundation,
        props,
        (setupProps) => {
            // The default key depends on the slot tabs, which are only readable during render, so derive it lazily
            let initial: { key: string | null } | undefined;
            return {
                get activeKey() {
                    initial ??= { key: TabsFoundation.getDefaultActiveKey(setupProps, entries.value) };
                    return initial.key;
                },
            };
        },
        (base) => ({
            notifyTabClick: (activeKey, event) => emit('tabClick', activeKey, event),
            notifyChange: (activeKey) => {
                emit('update:activeKey', activeKey);
                emit('change', activeKey);
            },
            setNewActiveKey: (activeKey) => base.setState({ activeKey }),
            notifyTabDelete: (tabKey) => emit('tabClose', tabKey),
        }),
        { context: () => config.value }
    );

    const activeKey = computed(() => (props.activeKey === undefined ? state.value.activeKey : props.activeKey));
    const motion = computed((prev?: MotionView) => TabsFoundation.getMotionView(prev, { activeKey: activeKey.value, propsActiveKey: props.activeKey, paneKeys: entries.value.map((entry) => entry.itemKey) }));

    provideTabsContext({
        view: computed(() => ({
            activeKey: activeKey.value,
            prevActiveKey: motion.value.prevActiveKey,
            forceDisableMotion: motion.value.forceDisableMotion,
            paneKeys: entries.value.map((entry) => entry.itemKey),
            lazyRender: props.lazyRender,
            tabPaneMotion: props.tabPaneMotion,
            tabPosition: props.tabPosition,
            type: props.type,
            size: props.size,
            tabsId,
            everyPanelMounted: !Array.isArray(props.tabList) && props.keepDOM,
            tabbableKey: TabsFoundation.getTabbableKey(entries.value, activeKey.value),
        })),
        tabClick: (itemKey, event) => foundation.handleTabClick(itemKey, event),
        handleKeyDown: (event, itemKey, closable) => foundation.handleKeyDown(event, itemKey, closable),
        deleteTab: (itemKey) => foundation.handleTabDelete(itemKey),
    });

    const isTablistName = (key: string) => key === 'aria-label' || key === 'aria-labelledby';

    const tabBarProps = (): TabBarProps => ({
        activeKey: activeKey.value,
        list: entries.value.map(({ tabSlot: _tab, iconSlot: _icon, ...item }) => item),
        type: props.type,
        size: props.size,
        tabPosition: props.tabPosition,
        collapsible: props.collapsible,
        showRestInDropdown: props.showRestInDropdown,
        more: props.more,
        arrowPosition: props.arrowPosition,
        visibleTabsStyle: props.visibleTabsStyle,
        dropdownProps: props.dropdownProps,
        class: props.tabBarClassName,
        style: props.tabBarStyle,
    });

    const barBindings = () => ({
        ...tabBarProps(),
        list: entries.value,
        tablistAttrs: splitControlAttrs(attrs, isTablistName).control,
        onVisibleTabsChange: (visibleState: Map<string, boolean>) => emit('visibleTabsChange', visibleState),
    });

    const tabBarNode = () =>
        h(TabBar, barBindings(), {
            ...(slots.arrow && { arrow: slots.arrow }),
            ...(slots.more && { more: slots.more }),
            ...(slots.moreContent && { moreContent: slots.moreContent }),
            ...(slots.tabBarExtraContent && { extra: slots.tabBarExtraContent }),
        });

    const contentNodes = () => {
        const nodes = slotNodes(slots.default?.() ?? []);
        return props.keepDOM ? nodes : nodes.filter(([node]) => !isTabPane(node) || paneKey(node) === activeKey.value);
    };

    // With tabList the content area is the single panel; without a matching tab it has nothing to be labelled by
    const tabListPanelAttrs = () => {
        const key = activeKey.value;
        return Array.isArray(props.tabList) && key !== null && props.tabList.some((item) => item.itemKey === key) ? { role: 'tabpanel', id: getPanelId(tabsId, key), 'aria-labelledby': getTabId(tabsId, key) } : {};
    };

    watch(
        () => props.activeKey,
        (key) => foundation.syncActiveKey(key)
    );

    onMounted(() => {
        // Registered after the first render so no slot is read outside render
        useDidUpdate(
            () => entries.value.map((entry) => entry.itemKey),
            () => foundation.handleTabPanesChange(entries.value),
            isEqual,
            'pre'
        );
    });
</script>

<template>
    <div v-bind="splitControlAttrs($attrs, isTablistName).root" :class="[cssClasses.TABS, `${cssClasses.TABS}-${props.tabPosition}`]">
        <slot v-if="$slots.tabBar" name="tabBar" :tabBar="tabBarNode()" :tabBarProps="tabBarProps()" />
        <TabBar v-else v-bind="barBindings()">
            <template v-if="$slots.arrow" #arrow="slotProps">
                <slot name="arrow" v-bind="slotProps" />
            </template>
            <template v-if="$slots.more" #more>
                <slot name="more" />
            </template>
            <template v-if="$slots.moreContent" #moreContent="slotProps">
                <slot name="moreContent" v-bind="slotProps" />
            </template>
            <template v-if="$slots.tabBarExtraContent" #extra>
                <slot name="tabBarExtraContent" />
            </template>
        </TabBar>
        <div :class="[cssClasses.TABS_CONTENT, `${cssClasses.TABS_CONTENT}-${props.tabPosition}`]" :style="props.contentStyle" v-bind="tabListPanelAttrs()">
            <slot v-if="Array.isArray(props.tabList)" />
            <template v-else>
                <component :is="node" v-for="[node, key] in contentNodes()" :key="key" />
            </template>
        </div>
    </div>
</template>
