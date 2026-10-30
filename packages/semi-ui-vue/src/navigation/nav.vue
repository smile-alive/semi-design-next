<script setup lang="ts">
    import { computed, onMounted, shallowRef, useTemplateRef, watch, type VNode } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/navigation/constants';
    import NavigationFoundation, { type NavigationAdapter, type NavigationBaseProps, type NavigationState, type NavItemType } from '@fibrae/semi-foundation/navigation/foundation';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import elementType from '../_base/element-type';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import useSlotVersion from '../_base/use-slot-version';
    import { provideNavContext } from './context';
    import type { NavEmits, NavProps, NavSlots } from './interface';
    import NavFooter from './nav-footer.vue';
    import NavHeader from './nav-header.vue';
    import { itemKeyOf, readItemTree } from './nav-icon';
    import NavItems from './nav-items.vue';

    interface Layout {
        headers: KeyedNode[];
        footers: KeyedNode[];
        /** Items, Subs and li children; other content is wrapped in a list item */
        list: { node: VNode; key: string; extra: boolean }[];
    }

    defineOptions({ name: 'Nav' });

    const props = withDefaults(defineProps<NavProps & /* @vue-ignore */ ElementProps<'nav', keyof NavProps | EmitHandlers<NavEmits>>>(), {
        bodyStyle: semiGlobalDefault('Nav', 'bodyStyle'),
        defaultIsCollapsed: semiGlobalDefault('Nav', 'defaultIsCollapsed'),
        defaultOpenKeys: semiGlobalDefault('Nav', 'defaultOpenKeys'),
        defaultSelectedKeys: semiGlobalDefault('Nav', 'defaultSelectedKeys'),
        footer: semiGlobalDefault('Nav', 'footer'),
        header: semiGlobalDefault('Nav', 'header'),
        isCollapsed: semiGlobalDefault('Nav', 'isCollapsed'),
        items: semiGlobalDefault('Nav', 'items'),
        limitIndent: () => semiDefault('Nav', 'limitIndent', true),
        mode: () => semiDefault('Nav', 'mode', 'vertical'),
        openKeys: semiGlobalDefault('Nav', 'openKeys'),
        selectedKeys: semiGlobalDefault('Nav', 'selectedKeys'),
        subDropdownProps: semiGlobalDefault('Nav', 'subDropdownProps'),
        subNavCloseDelay: () => semiDefault('Nav', 'subNavCloseDelay', numbers.DEFAULT_SUBNAV_CLOSE_DELAY),
        subNavMotion: () => semiDefault('Nav', 'subNavMotion', true),
        subNavOpenDelay: () => semiDefault('Nav', 'subNavOpenDelay', numbers.DEFAULT_SUBNAV_OPEN_DELAY),
        toggleIconPosition: () => semiDefault('Nav', 'toggleIconPosition', 'right'),
        tooltipHideDelay: () => semiDefault('Nav', 'tooltipHideDelay', numbers.DEFAULT_TOOLTIP_HIDE_DELAY),
        tooltipShowDelay: () => semiDefault('Nav', 'tooltipShowDelay', numbers.DEFAULT_TOOLTIP_SHOW_DELAY),
    });

    const emit = defineEmits<NavEmits>();
    const slots = defineSlots<NavSlots>();

    const navEl = useTemplateRef('nav');
    let mounted = false;

    // Texts remount on collapse/expand, so they fade in only while the width animates. Pre flush: same patch as the class.
    const collapseAnimating = shallowRef(false);

    // The itemKey tree of the Nav.Item and Nav.Sub children. Read during render, never in setup: an h() or JSX slot warns
    // outside render. An equal tree keeps its reference, so only a structural change rebuilds the menu.
    const slotVersion = useSlotVersion(slots);

    const prefix = cssClasses.PREFIX;

    const childTree = computed<NavItemType[]>((previous) => {
        void slotVersion.value;
        const next = readItemTree(slots.default?.() ?? []);
        return previous && isEqual(previous, next) ? previous : next;
    });

    // null reaches the foundation as a controlled empty value, which its readers handle
    const foundationProps = props as Readonly<NavigationBaseProps>;

    const { foundation, state } = useFoundation<NavigationFoundation, NavigationAdapter, NavigationBaseProps, NavigationState>(
        NavigationFoundation,
        foundationProps,
        (setupProps) => {
            // First-render open/selected keys depend on the tree, so they are derived on first read (also on the server).
            const initial = computed(() => NavigationFoundation.getInitialState(setupProps, childTree.value));
            return {
                isCollapsed: Boolean(props.isCollapsed ?? props.defaultIsCollapsed),
                get openKeys() {
                    return initial.value.openKeys;
                },
                get selectedKeys() {
                    return initial.value.selectedKeys;
                },
            };
        },
        (base) => ({
            getItemsFromChildren: () => childTree.value,
            setIsCollapsed: (isCollapsed) => base.setState({ isCollapsed }),
            notifyCollapseChange: (isCollapsed) => {
                emit('update:isCollapsed', isCollapsed);
                emit('collapseChange', isCollapsed);
            },
            updateSelectedKeys: (selectedKeys) => base.setState({ selectedKeys }),
            updateOpenKeys: (openKeys) => base.setState({ openKeys: [...openKeys] }),
        }),
        // the tree is not read before mount, where setup would call the slot
        { props: { children: () => (mounted ? childTree.value : undefined) } }
    );

    const isCollapsed = computed(() => NavigationFoundation.getIsCollapsed(foundationProps, state.value));
    const openKeysIsControlled = computed(() => NavigationFoundation.isOpenKeysControlled(foundationProps, isCollapsed.value));
    const openKeys = computed(() => NavigationFoundation.getOpenKeys(foundationProps, state.value, isCollapsed.value));
    const formatted = computed(() => NavigationFoundation.getFormattedItems({ items: props.items }, childTree.value));
    const selectedKeys = computed(() => NavigationFoundation.getSelectedKeys(foundationProps, state.value, formatted.value.itemKeysMap));

    provideNavContext({
        view: computed(() => ({
            isCollapsed: isCollapsed.value,
            mode: props.mode,
            isInSubNav: false,
            openKeys: openKeys.value,
            openKeysIsControlled: openKeysIsControlled.value,
            selectedKeys: selectedKeys.value,
            selectedKeysIsControlled: props.selectedKeys !== undefined,
            limitIndent: props.limitIndent,
            toggleIconPosition: props.toggleIconPosition,
            subNavMotion: props.subNavMotion,
            subNavOpenDelay: props.subNavOpenDelay,
            subNavCloseDelay: props.subNavCloseDelay,
            tooltipShowDelay: props.tooltipShowDelay,
            tooltipHideDelay: props.tooltipHideDelay,
        })),
        wrapper: () => slots.wrapper,
        toggleCollapsed: foundation.handleCollapseChange,
        updateSelectedKeys: foundation.updateSelectedKeys,
        addOpenKey: foundation.addOpenKey,
        removeOpenKey: foundation.removeOpenKey,
        notifySelect: (data) => {
            emit('update:selectedKeys', data.selectedKeys);
            emit('select', data);
        },
        notifyClick: (data) => emit('click', data),
        notifyOpenChange: (data) => {
            emit('update:openKeys', data.openKeys);
            emit('openChange', data);
        },
    });

    const onTransitionEnd = (event: TransitionEvent) => {
        if (event.propertyName === 'width') collapseAnimating.value = false;
    };

    const layout = () => {
        const result: Layout = { headers: [], footers: [], list: [] };
        for (const [node, key] of slotNodes(slots.default?.() ?? [])) {
            const type = elementType(node);
            if (type === 'Nav.Header') {
                result.headers.push([node, key]);
            } else if (type === 'Nav.Footer') {
                result.footers.push([node, key]);
            } else {
                // Other content still sits in the list, so it gets a list item; the li has no box and changes no layout. A node
                // with itemKey is a navigation item that renders its own li, wrapped or not.
                const extra = type !== 'Nav.Item' && type !== 'Nav.Sub' && node.type !== 'li' && itemKeyOf(node) == null;
                result.list.push({ node, key, extra });
            }
        }
        return result;
    };

    watch(isCollapsed, () => {
        collapseAnimating.value = true;
    });

    // No transitionend when the width does not animate (transition off, fixed width, hidden); getAnimations flushes style.
    watch(
        collapseAnimating,
        (animating) => {
            const animatesWidth = navEl.value?.getAnimations().some((animation) => animation instanceof CSSTransition && animation.transitionProperty === 'width');
            if (animating && !animatesWidth) collapseAnimating.value = false;
        },
        { flush: 'post' }
    );

    onMounted(() => {
        mounted = true;
        // registered after the first render, which already read the tree, so no slot is called here
        watch(
            () => ({ ...foundationProps, children: childTree.value }),
            (_, previous) => foundation.handlePropsUpdate(previous)
        );
    });
</script>

<template>
    <!-- APG disclosure navigation: a navigation landmark holding plain lists of links and buttons -->
    <nav
        ref="nav"
        :class="[
            prefix,
            {
                [`${prefix}-collapsed`]: isCollapsed,
                [`${prefix}-collapse-animating`]: collapseAnimating,
                [`${prefix}-horizontal`]: props.mode === 'horizontal',
                [`${prefix}-vertical`]: props.mode === 'vertical',
            },
        ]"
        @transitionend.self="onTransitionEnd"
    >
        <div v-for="(parts, i) in [layout()]" :key="i" :class="`${prefix}-inner`">
            <div :class="[`${prefix}-header-list-outer`, { [`${prefix}-header-list-outer-collapsed`]: isCollapsed }]">
                <NavHeader v-if="props.header || $slots.header" v-bind="props.header ?? {}">
                    <slot name="header" />
                </NavHeader>
                <component :is="node" v-for="[node, key] in parts.headers" :key="key" />
                <div :class="`${prefix}-list-wrapper`" :style="props.bodyStyle">
                    <ul :class="`${prefix}-list`">
                        <NavItems v-if="formatted.formattedItems.length" :items="formatted.formattedItems" :level="0" :subDropdownProps="props.subDropdownProps">
                            <template v-if="$slots.icon" #icon="p">
                                <slot v-bind="p" name="icon" />
                            </template>
                            <template v-if="$slots.text" #text="p">
                                <slot v-bind="p" name="text" />
                            </template>
                            <template v-if="$slots.toggleIcon" #toggleIcon="p">
                                <slot v-bind="p" name="toggleIcon" />
                            </template>
                            <template v-if="$slots.expandIcon" #expandIcon="p">
                                <slot v-bind="p" name="expandIcon" />
                            </template>
                        </NavItems>
                        <template v-for="entry in parts.list" :key="entry.key">
                            <li v-if="entry.extra" :class="`${prefix}-list-extra`">
                                <component :is="entry.node" />
                            </li>
                            <component :is="entry.node" v-else />
                        </template>
                    </ul>
                </div>
            </div>
            <NavFooter v-if="props.footer || $slots.footer" v-bind="props.footer ?? {}">
                <slot name="footer" />
            </NavFooter>
            <component :is="node" v-for="[node, key] in parts.footers" :key="key" />
        </div>
    </nav>
</template>
