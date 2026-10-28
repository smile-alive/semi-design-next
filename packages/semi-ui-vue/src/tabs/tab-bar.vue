<script setup lang="ts">
    import { computed, h, normalizeStyle, onMounted, onUpdated, shallowRef, Text, useTemplateRef, watch, type CSSProperties, type HTMLAttributes, type StyleValue, type VNode } from 'vue';
    import { cssClasses, getBarItemKey } from '@fibrae/semi-foundation/tabs/constants';
    import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
    import { IconChevronDown } from '@fibrae/semi-icons-vue';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useRaf from '../_base/use-raf';
    import useResizeObserver from '../_base/use-resize-observer';
    import Dropdown, { DropdownItem, DropdownMenu } from '../dropdown';
    import useLocale from '../locale/use-locale';
    import OverflowList from '../overflow-list';
    import { provideTabsContext, useTabsContext } from './context';
    import { getTabId } from './ids';
    import type { OverflowItem, PlainTab, TabPosition, TabsArrowSlotProps, TabsDropdownItemProps, TabsDropdownProps, TabSize, TabsMore, TabsMoreContentSlotProps, TabType } from './interface';
    import type { TabEntry } from './read-panes';
    import TabBarArrow from './tab-bar-arrow.vue';
    import TabItem from './tab-item.vue';

    interface Layout {
        shown: TabEntry[];
        hidden: TabEntry[];
        dropdownProps?: TabsDropdownItemProps;
    }

    const props = defineProps<{
        activeKey: string | null;
        list: TabEntry[];
        type: TabType;
        size: TabSize;
        tabPosition: TabPosition;
        collapsible: boolean | 'auto';
        showRestInDropdown: boolean;
        more?: number | TabsMore;
        arrowPosition: 'both' | 'start' | 'end';
        visibleTabsStyle?: StyleValue;
        dropdownProps?: TabsDropdownProps;
        /** The Tabs' aria-label and aria-labelledby, which name the tablist */
        tablistAttrs: Record<string, unknown>;
    }>();

    const emit = defineEmits<{
        visibleTabsChange: [visibleState: Map<string, boolean>];
    }>();

    const slots = defineSlots<{
        arrow?: (props: TabsArrowSlotProps) => VNode[];
        more?: () => VNode[];
        moreContent?: (props: TabsMoreContentSlotProps) => VNode[];
        extra?: () => VNode[];
    }>();

    const locale = useLocale('Tabs');
    const ctx = useTabsContext();

    const bar = useTemplateRef('bar');
    let isFirstShowInViewport = true;
    const shouldCollapse = shallowRef(false);

    // Bar width at which the tabs overflowed. The collapsed layout can fit every tab at that width, but the uncollapsed one
    // cannot, so leaving the collapse at or below this width would flip-flop between the two.
    let collapsedWidth = 0;

    const prefix = cssClasses.TABS_BAR;
    const collapsed = computed(() => (props.collapsible === 'auto' ? shouldCollapse.value : props.collapsible));

    const overflowItems = computed((): OverflowItem[] =>
        props.list.map(({ tabSlot: _tab, iconSlot: _icon, ...item }) => ({
            key: getBarItemKey(item.itemKey),
            active: item.itemKey === props.activeKey,
            ...item,
        }))
    );

    // Only turns collapse on; once collapsed, the OverflowList visible-state event decides when to leave it.
    const checkOverflow = () => {
        const barEl = bar.value;
        if (props.collapsible !== 'auto' || shouldCollapse.value || !barEl) return;
        if (TabsFoundation.isTabsOverflowing(barEl, props.tabPosition)) {
            collapsedWidth = barEl.clientWidth;
            shouldCollapse.value = true;
        }
    };

    const scrollActiveTabItemIntoView = (logicalPosition?: ScrollLogicalPosition, behavior?: ScrollBehavior) => TabsFoundation.scrollTabIntoView(bar.value, getBarItemKey(`${props.activeKey}`), logicalPosition, behavior);

    const entryOf = (itemKey: string) => props.list.find((entry) => entry.itemKey === itemKey);

    const plain = (entries: TabEntry[]): PlainTab[] => entries.map(({ tabSlot: _tab, iconSlot: _icon, ...item }) => item);

    // A tablist may own only tabs: arrows, more trigger and extra content stay outside it
    const tablistAttrs = (): HTMLAttributes & Record<string, unknown> => ({
        ...props.tablistAttrs,
        role: 'tablist',
        'aria-orientation': props.tabPosition === 'left' ? 'vertical' : 'horizontal',
    });

    const tabItemProps = (entry: PlainTab) => ({
        itemKey: entry.itemKey,
        disabled: entry.disabled,
        closable: entry.closable,
        selected: entry.itemKey === props.activeKey,
        size: props.size,
        type: props.type,
        tabPosition: props.tabPosition,
    });

    const onTabClick = (itemKey: string, event: MouseEvent) => ctx?.tabClick(itemKey, event);

    // Pops the item so repeated clicks before the next render reach the following hidden tab
    const handleArrowClick = (items: OverflowItem[], position: 'start' | 'end') => {
        const lastItem = position === 'start' ? items.pop() : items.shift();
        if (lastItem) {
            TabsFoundation.scrollTabIntoView(bar.value, getBarItemKey(lastItem.itemKey));
        }
    };

    const arrowProps = (items: OverflowItem[], position: 'start' | 'end') => ({
        items: items.map((item) => ({ ...entryOf(item.itemKey), ...item })),
        position,
        showRestInDropdown: props.showRestInDropdown,
        dropdownProps: props.dropdownProps?.[position],
        onArrowClick: () => handleArrowClick(items, position),
        onTabClick,
    });

    const arrowNode = (items: OverflowItem[], position: 'start' | 'end') => h(TabBarArrow, arrowProps(items, position));

    const onVisibleStateChange = (visibleMap: Map<string, boolean>) => {
        const { visibleState, isShowInViewport, hasHidden } = TabsFoundation.readVisibleState(visibleMap);
        // first show only: https://github.com/DouyinFE/semi-design/issues/2917
        if (isFirstShowInViewport && isShowInViewport) {
            scrollActiveTabItemIntoView('nearest', 'auto');
            isFirstShowInViewport = false;
        }
        if (props.collapsible === 'auto' && isShowInViewport) {
            shouldCollapse.value = hasHidden || (bar.value !== null && bar.value.clientWidth <= collapsedWidth);
        }
        emit('visibleTabsChange', visibleState);
    };

    const layout = (): Layout => {
        const { more, list } = props;
        if (!more) return { shown: list, hidden: [] };
        const { kept, moved } = TabsFoundation.splitMore(list, more);
        return { shown: kept, hidden: moved, dropdownProps: typeof more === 'object' ? more.dropdownProps : undefined };
    };

    // the collapsed bar shows every tab; otherwise the tabs moved into the more menu are not in the tablist
    const tabbableKey = computed(() => TabsFoundation.getTabbableKey(collapsed.value ? props.list : layout().shown, props.activeKey));

    // the remembered width no longer applies once tabs are added, removed or retitled
    watch(
        () => props.list.map((entry) => `${entry.itemKey}:${entry.tab}`).join('\n'),
        () => {
            collapsedWidth = 0;
        }
    );

    useResizeObserver(() => (props.collapsible === 'auto' ? bar.value : null), checkOverflow);

    const scheduleFrame = useRaf();

    watch(
        () => props.activeKey,
        () => {
            if (collapsed.value) scrollActiveTabItemIntoView();
        },
        { flush: 'post' }
    );

    // fallback for when ResizeObserver does not report after mount
    onMounted(() => scheduleFrame(checkOverflow));
    onUpdated(checkOverflow);

    if (ctx) {
        provideTabsContext({ ...ctx, view: computed(() => ({ ...ctx.view.value, tabbableKey: tabbableKey.value })) });
    }

    // Only float moves to the wrapper; the element keeps its other styles
    const extraNodes = () => slotNodes(slots.extra?.() ?? []).filter(([node]) => node.type !== Text || String(node.children).trim() !== '');

    const extraFloat = (nodes: KeyedNode[]) => {
        const style = nodes.length === 1 ? normalizeStyle(nodes[0][0].props?.style) : undefined;
        return (typeof style === 'object' ? (style as CSSProperties).float : undefined) ?? 'inline-end';
    };
</script>

<template>
    <div
        ref="bar"
        :class="[
            prefix,
            `${prefix}-${props.tabPosition}`,
            {
                [cssClasses.TABS_BAR_LINE]: props.type === 'line',
                [cssClasses.TABS_BAR_CARD]: props.type === 'card',
                [cssClasses.TABS_BAR_BUTTON]: props.type === 'button',
                [cssClasses.TABS_BAR_SLASH]: props.type === 'slash',
                [`${prefix}-collapse`]: collapsed,
            },
        ]"
    >
        <OverflowList v-if="collapsed" :class="`${prefix}-overflow-list`" itemKey="key" :items="overflowItems" :overflowRenderDirection="props.arrowPosition" renderMode="scroll" :wrapperProps="tablistAttrs()" :wrapperStyle="props.visibleTabsStyle" @visibleStateChange="onVisibleStateChange">
            <template #item="{ item }">
                <template v-for="(entry, e) in [entryOf(item.itemKey)]" :key="e">
                    <TabItem v-bind="tabItemProps(item)">
                        <template #tab>
                            <template v-if="entry?.tabSlot">
                                <component :is="node" v-for="[node, key] in slotNodes(entry.tabSlot())" :key="key" />
                            </template>
                            <template v-else>{{ item.tab }}</template>
                        </template>
                        <template v-if="entry?.iconSlot" #icon>
                            <component :is="node" v-for="[node, key] in slotNodes(entry.iconSlot())" :key="key" />
                        </template>
                    </TabItem>
                </template>
            </template>
            <template #overflow="{ items, position }">
                <slot v-if="$slots.arrow" :defaultNode="arrowNode(items, position)" :items="items" name="arrow" :onClick="() => handleArrowClick(items, position)" :position="position" />
                <TabBarArrow v-else v-bind="arrowProps(items, position)" />
            </template>
        </OverflowList>
        <template v-for="(view, v) in [layout()]" v-else :key="v">
            <div v-bind="tablistAttrs()" :class="`${prefix}-tablist`">
                <TabItem v-for="entry in view.shown" :key="getBarItemKey(entry.itemKey)" v-bind="tabItemProps(entry)">
                    <template #tab>
                        <template v-if="entry.tabSlot">
                            <component :is="node" v-for="[node, key] in slotNodes(entry.tabSlot())" :key="key" />
                        </template>
                        <template v-else>{{ entry.tab }}</template>
                    </template>
                    <template v-if="entry.iconSlot" #icon>
                        <component :is="node" v-for="[node, key] in slotNodes(entry.iconSlot())" :key="key" />
                    </template>
                </TabItem>
            </div>
            <Dropdown v-if="view.hidden.length" :class="`${prefix}-more-dropdown-${props.type}`" clickToHide position="bottomLeft" showTick trigger="hover" v-bind="view.dropdownProps">
                <slot name="more">
                    <button :class="[`${prefix}-more-trigger`, `${prefix}-more-trigger-${props.type}`]" type="button">
                        <span :class="`${prefix}-more-trigger-content`">
                            <span>{{ locale.locale.more }}</span>
                            <IconChevronDown :class="`${prefix}-more-trigger-content-icon`" />
                        </span>
                    </button>
                </slot>
                <template #content>
                    <slot :items="plain(view.hidden)" name="moreContent">
                        <DropdownMenu>
                            <DropdownItem v-for="entry in view.hidden" :key="entry.itemKey" :active="entry.itemKey === props.activeKey" :disabled="entry.disabled" @click="onTabClick(entry.itemKey, $event)">
                                <template v-if="entry.iconSlot" #icon>
                                    <component :is="node" v-for="[node, key] in slotNodes(entry.iconSlot())" :key="key" />
                                </template>
                                <template v-if="entry.tabSlot">
                                    <component :is="node" v-for="[node, key] in slotNodes(entry.tabSlot())" :key="key" />
                                </template>
                                <template v-else>{{ entry.tab }}</template>
                            </DropdownItem>
                        </DropdownMenu>
                    </slot>
                </template>
            </Dropdown>
            <!-- A panel is labelled by its tab's id, and a tab in the menu is not rendered: this hidden copy of its label
                 takes the id, and aria-labelledby still reads hidden elements it points to -->
            <template v-if="ctx">
                <span v-for="entry in view.hidden" :id="getTabId(ctx.view.value.tabsId, entry.itemKey)" :key="entry.itemKey" hidden>
                    <template v-if="entry.tabSlot">
                        <component :is="node" v-for="[node, key] in slotNodes(entry.tabSlot())" :key="key" />
                    </template>
                    <template v-else>{{ entry.tab }}</template>
                </span>
            </template>
        </template>
        <template v-for="(nodes, n) in [extraNodes()]" :key="n">
            <div v-if="nodes.length" :class="[cssClasses.TABS_BAR_EXTRA, `${prefix}-${props.type}-extra`, `${prefix}-${props.type}-extra-${props.size}`]" :style="{ float: extraFloat(nodes) }" x-semi-prop="tabBarExtraContent">
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </div>
        </template>
    </div>
</template>
