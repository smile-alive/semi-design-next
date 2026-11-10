<script setup lang="ts">
    import { computed, h, useTemplateRef, type VNode } from 'vue';
    import { DEFAULT_TOOLTIP, cssClasses } from '@fibrae/semi-foundation/components/breadcrumb/constants';
    import BreadcrumbFoundation, { type BreadcrumbAdapter, type BreadcrumbState } from '@fibrae/semi-foundation/components/breadcrumb/foundation';
    import { getDataAttr } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/breadcrumb/breadcrumb.scss';
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { type ElementProps, semiDefault, semiGlobalDefault, useFoundation } from '../../base/index';
    import { useFocusHandover } from '../../composables/index';
    import { elementType, slotNodes } from '../../utils/index';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import BreadcrumbItem from './breadcrumb-item.vue';
    import { provideBreadcrumbContext } from './context';
    import type { BreadcrumbProps, BreadcrumbSlots, Route } from './interface';

    type RouteEntry = { kind: 'route'; key: string; index: number; route: Route & { _origin: Route } };
    type NodeEntry = { kind: 'node'; key: string; index: number; node: VNode };
    type Entry = RouteEntry | NodeEntry;

    interface Layout {
        total: number;
        collapsed: boolean;
        start: number;
        end: number;
        items: (Entry | { kind: 'more'; key: string })[];
        rest: Entry[];
    }

    type Foundation = BreadcrumbFoundation<BreadcrumbProps>;
    type Adapter = BreadcrumbAdapter<BreadcrumbProps>;

    defineOptions({ name: 'Breadcrumb' });

    const props = withDefaults(defineProps<BreadcrumbProps & /* @vue-ignore */ ElementProps<'nav', keyof BreadcrumbProps>>(), {
        activeIndex: semiGlobalDefault('Breadcrumb', 'activeIndex'),
        autoCollapse: () => semiDefault('Breadcrumb', 'autoCollapse', true),
        compact: () => semiDefault('Breadcrumb', 'compact', true),
        maxItemCount: () => semiDefault('Breadcrumb', 'maxItemCount', 4),
        moreType: () => semiDefault('Breadcrumb', 'moreType', 'default'),
        routes: () => semiDefault('Breadcrumb', 'routes', []),
        separator: () => semiDefault('Breadcrumb', 'separator', '/'),
        showTooltip: () => semiDefault('Breadcrumb', 'showTooltip', DEFAULT_TOOLTIP),
        onClick: undefined,
    });

    const slots = defineSlots<BreadcrumbSlots>();

    const locale = useLocale('Breadcrumb');

    // Expanding removes the more button, which held focus: the first item it hid takes over, else the nav itself
    const root = useTemplateRef('root');
    const list = useTemplateRef('list');

    const { foundation, state } = useFoundation<Foundation, Adapter, BreadcrumbProps, BreadcrumbState>(
        BreadcrumbFoundation,
        props,
        () => BreadcrumbFoundation.getInitialState(),
        () => ({})
    );

    const prefix = cssClasses.PREFIX;

    provideBreadcrumbContext({
        view: computed(() => ({
            compact: props.compact,
            showTooltip: props.showTooltip,
            separator: props.separator,
            hasOnClick: Boolean(props.onClick),
        })),
        onClick: (info, e) => props.onClick?.(info, e),
        separatorSlot: () => slots.separator?.(),
    });

    const layout = (): Layout => {
        const routes = props.routes.length > 0 ? BreadcrumbFoundation.genRoutes(props.routes) : null;
        const entries: Entry[] = routes
            ? routes.map((route, index) => ({
                  kind: 'route',
                  index,
                  route,
                  key: String(route._origin.key || `item-${route.name || route.path}-${index}`),
              }))
            : slotNodes(slots.default?.() ?? []).map(([node, key], index) => ({ kind: 'node', index, node, key }));
        const total = entries.length;
        const { start, end } = BreadcrumbFoundation.getCollapseRange(total, props.maxItemCount, props.activeIndex);
        const collapsed = BreadcrumbFoundation.shouldCollapse(props.autoCollapse, { start, end }, state.value.isCollapsed);
        return {
            total,
            collapsed,
            start,
            end,
            items: collapsed ? [...entries.slice(0, start), { kind: 'more', key: `more-${total}` }, ...entries.slice(end + 1)] : entries,
            rest: collapsed ? entries.slice(start, end + 1) : [],
        };
    };

    const handoverFocus = useFocusHandover(() => {
        const nav = root.value;
        const target = list.value?.children[layout().start]?.querySelector<HTMLElement>('a[href], [tabindex]:not([tabindex="-1"])');
        if (target) return target;
        if (nav) nav.tabIndex = -1;
        return nav;
    });

    const itemProps = (index: number, view: Layout) => ({
        active: BreadcrumbFoundation.isActive(index, view.total, props.activeIndex),
        shouldRenderSeparator: BreadcrumbFoundation.shouldRenderSeparator(index, view.total, { ...view, hasCustomMore: Boolean(slots.more), moreType: props.moreType }),
    });

    // Only the Item props a route may set, and its data-*, so other route fields stay off the DOM.
    const routeProps = ({ route, index }: RouteEntry, view: Layout) => ({
        ...getDataAttr(route),
        ...itemProps(index, view),
        href: route.href,
        noLink: route.noLink,
        route: route._origin,
        separator: route.separator,
    });

    const isItemNode = (node: VNode) => elementType(node) === 'Breadcrumb.Item';

    const routeSlots = ({ route, index }: RouteEntry) => ({
        default: () => (slots.item ? slots.item({ route: route._origin, index }) : (route.name ?? '')),
        ...(slots.icon && { icon: () => slots.icon?.({ route: route._origin, index }) ?? [] }),
    });

    // The more slot receives mountable nodes, like React's renderMore(restItem: ReactNode[]), and the popover shows the
    // same nodes; building them is the one place this SFC calls h().
    const restItems = (view: Layout) =>
        view.rest.map((entry) => {
            if (entry.kind === 'route') return h(BreadcrumbItem, { key: entry.key, ...routeProps(entry, view) }, routeSlots(entry));
            return isItemNode(entry.node) ? h(entry.node, { key: entry.key, ...itemProps(entry.index, view) }) : h('li', { key: entry.key }, [entry.node]);
        });
</script>

<template>
    <nav ref="root" :aria-label="locale.locale.label" :class="[`${prefix}-wrapper`, props.compact ? `${prefix}-wrapper-compact` : `${prefix}-wrapper-loose`]">
        <ol ref="list" :class="`${prefix}-list`">
            <template v-for="(view, v) in [layout()]" :key="v">
                <!-- The key sits on each entry's fragment, so the branches inside cannot replace an item's own key. -->
                <template v-for="entry in view.items" :key="entry.key">
                    <li v-if="entry.kind === 'more'" :ref="handoverFocus" :class="`${prefix}-collapse`">
                        <span :class="`${prefix}-item-wrap`">
                            <span :aria-label="locale.locale.expand" :class="[`${prefix}-item`, `${prefix}-item-more`]" role="button" tabindex="0" @click="foundation.handleExpand" @keydown="foundation.handleExpandKeyDown($event as KeyboardEvent & { currentTarget: Node })">
                                <slot v-if="$slots.more" name="more" :restItems="restItems(view)" />
                                <IconMore v-else-if="props.moreType === 'default'" />
                                <Popover v-else showArrow :style="{ padding: '12px' }">
                                    <!-- the more button around it is the Tab stop and expands every item -->
                                    <IconMore tabindex="-1" />
                                    <template #content>
                                        <ol :class="`${prefix}-list`">
                                            <template v-for="(item, i) in restItems(view)" :key="view.rest[i].key">
                                                <component :is="item" />
                                                <li v-if="i < view.rest.length - 1" aria-hidden="true" :class="`${prefix}-restItem`">
                                                    <slot name="separator">{{ props.separator }}</slot>
                                                </li>
                                            </template>
                                        </ol>
                                    </template>
                                </Popover>
                            </span>
                            <span :class="`${prefix}-separator`" x-semi-prop="separator">
                                <slot name="separator">{{ props.separator }}</slot>
                            </span>
                        </span>
                    </li>
                    <BreadcrumbItem v-else-if="entry.kind === 'route'" v-bind="routeProps(entry, view)">
                        <template #default>
                            <slot :index="entry.index" name="item" :route="entry.route._origin">{{ entry.route.name }}</slot>
                        </template>
                        <template v-if="$slots.icon" #icon>
                            <slot :index="entry.index" name="icon" :route="entry.route._origin" />
                        </template>
                    </BreadcrumbItem>
                    <component :is="entry.node" v-else-if="isItemNode(entry.node)" v-bind="itemProps(entry.index, view)" />
                    <!-- an ol holds only li, so other nodes get one of their own -->
                    <li v-else>
                        <component :is="entry.node" />
                    </li>
                </template>
            </template>
        </ol>
    </nav>
</template>
