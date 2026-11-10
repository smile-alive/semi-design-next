<script setup lang="ts" generic="T extends OverflowListItem = OverflowListItem">
    import { computed, onBeforeUpdate, onMounted, onUpdated, shallowRef, Text, useAttrs, useTemplateRef, type CSSProperties } from 'vue';
    import { cssClasses, SCROLL_KEY_ATTRIBUTE } from '@fibrae/semi-foundation/components/overflow-list/constants';
    import OverflowListFoundation, { type ItemKeyOption, type OverflowListAdapter, type OverflowListBaseProps, type OverflowListBaseState } from '@fibrae/semi-foundation/components/overflow-list/foundation';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/overflow-list/overflow-list.scss';
    import { type ElementProps, type EmitHandlers, semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation } from '../../base/index';
    import { useIntersectionObserver, useResizeObserver } from '../../composables/index';
    import { slotNodes } from '../../utils/index';
    import type { OverflowListEmits, OverflowListItem, OverflowListKey, OverflowListProps, OverflowListSlots } from './interface';
    import MeasuredBox from './measured-box.vue';

    type Foundation = OverflowListFoundation<OverflowListBaseProps>;
    type Adapter = OverflowListAdapter<OverflowListBaseProps>;

    defineOptions({ name: 'OverflowList' });

    const props = withDefaults(defineProps<OverflowListProps<T> & /* @vue-ignore */ ElementProps<'div', keyof OverflowListProps<T> | EmitHandlers<OverflowListEmits<T>>>>(), {
        collapseFrom: () => semiDefault('OverflowList', 'collapseFrom', 'end'),
        items: semiGlobalDefault('OverflowList', 'items'),
        // Function-typed props cannot take a factory default; the global default is read in `itemKey` below.
        itemKey: undefined,
        minVisibleItems: () => semiDefault('OverflowList', 'minVisibleItems', 0),
        overflowRenderDirection: () => semiDefault('OverflowList', 'overflowRenderDirection', 'both'),
        renderMode: () => semiDefault('OverflowList', 'renderMode', 'collapse'),
        threshold: () => semiDefault('OverflowList', 'threshold', 0.75),
        wrapperClassName: semiGlobalDefault('OverflowList', 'wrapperClassName'),
        wrapperProps: semiGlobalDefault('OverflowList', 'wrapperProps'),
        wrapperStyle: semiGlobalDefault('OverflowList', 'wrapperStyle'),
    });

    const emit = defineEmits<OverflowListEmits<T>>();
    const slots = defineSlots<OverflowListSlots<T>>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();

    const root = useTemplateRef('root');
    const wrapper = useTemplateRef('wrapper');

    // No root: visibility is judged against the viewport, which the foundation and Tabs rely on. The nodes come from slot
    // output no watcher tracks, so each commit compares them and assigns only a changed list; an item rendering another
    // element under the same key is then observed again.
    const scrollNodes = shallowRef<Element[]>([]);

    const prefix = cssClasses.PREFIX;
    const items = computed(() => props.items ?? []);

    // T only narrows the item for callers; 'key' is the foundation's own default path.
    const itemKey = computed(() => (props.itemKey ?? readSemiDefault(semi, 'OverflowList', 'itemKey', 'key')) as ItemKeyOption);
    const isScroll = computed(() => props.renderMode === 'scroll');

    const keyOf = (item: OverflowListItem, index: number) => OverflowListFoundation.getItemKey(itemKey.value, item, index);

    const viewProps = (): OverflowListBaseProps => ({
        items: items.value,
        style: attrs.style as object | undefined,
        renderMode: props.renderMode,
        collapseFrom: props.collapseFrom,
        itemKey: itemKey.value,
    });

    const view = shallowRef(OverflowListFoundation.createView(viewProps()));

    const { foundation, state } = useFoundation<Foundation, Adapter, OverflowListBaseProps, OverflowListBaseState>(
        OverflowListFoundation,
        props as Readonly<OverflowListBaseProps>,
        () => OverflowListFoundation.getInitialState(),
        () => ({
            notifyVisibleStateChange: (visibleState) => emit('visibleStateChange', visibleState),
            updateView: (update) => {
                view.value = update(view.value);
            },
            notifyIntersect: (res) => emit('intersect', res),
            notifyOverflow: (overflow) => emit('overflow', overflow as T[]),
        }),
        { props: { items: () => items.value, itemKey: () => itemKey.value } }
    );

    const rootStyle = computed((): CSSProperties | undefined =>
        isScroll.value
            ? undefined
            : {
                  maxWidth: '100%',
                  visibility: OverflowListFoundation.isHidden(view.value) ? 'hidden' : 'visible',
              }
    );

    const collapseItems = computed(() => OverflowListFoundation.getVisibleItems(view.value, itemKey.value) as Array<{ item: T; index: number; key: OverflowListKey }>);
    const scrollOverflow = computed(() => OverflowListFoundation.getOverflowItem({ items: items.value, itemKey: itemKey.value }, { visibleState: state.value.visibleState, scrollOverflow: view.value.scrollOverflow }) as [T[], T[]]);

    // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
    const onItemResize = (entry: ResizeObserverEntry, key: OverflowListKey) => foundation.handleItemResize(key, entry.contentRect.width, view.value.maxCount);

    const onOverflowResize = (entry: ResizeObserverEntry) => foundation.handleOverflowResize(entry.contentRect.width);

    const syncScrollNodes = () => {
        const nodes = isScroll.value && wrapper.value ? [...wrapper.value.children].filter((node) => node.hasAttribute(SCROLL_KEY_ATTRIBUTE)) : [];
        const same = nodes.length === scrollNodes.value.length && nodes.every((node, index) => node === scrollNodes.value[index]);
        if (!same) scrollNodes.value = nodes;
    };

    // Runs after every commit like React's dependency-free layout effect: keys and scroll nodes come from slot output no
    // watcher tracks. It settles: handleCommit writes the view only when leaving 'calculating'.
    const afterRender = () => {
        foundation.handleCommit(view.value);
        syncScrollNodes();
    };

    const overflowNodes = () => slotNodes(slots.overflow?.({ items: view.value.overflow as T[], position: props.collapseFrom }) ?? []).filter(([node]) => node.type !== Text || String(node.children).trim() !== '');

    // Scroll mode: the first element of each item's slot output carries the SCROLL_KEY_ATTRIBUTE the observer reports by;
    // <component :is> keeps the element's own ref.
    const scrollItems = () =>
        view.value.visible.flatMap((item, index) => {
            const node = slotNodes(slots.item?.({ item: item as T, index }) ?? []).find(([n]) => n.type !== Text)?.[0];
            return node ? [{ node, key: String(keyOf(item, index)) }] : [];
        });

    // Like React, reset the view in render when items, style, keys or collapseFrom change. attrs.style is untracked, but
    // its change still updates the component and runs this hook first.
    onBeforeUpdate(() => {
        view.value = OverflowListFoundation.syncView(viewProps(), view.value, state.value.containerWidth);
    });

    useResizeObserver(
        () => (isScroll.value ? null : root.value),
        ([entry]) => foundation.handleContainerResize(entry.contentRect.width)
    );

    // registered after useFoundation, so the foundation is connected first
    onMounted(afterRender);
    onUpdated(afterRender);

    // After afterRender, whose mounted run assigns the nodes first: the observer then starts within the mount.
    useIntersectionObserver(scrollNodes, foundation.handleIntersect, () => ({ threshold: props.threshold }));
</script>

<template>
    <div ref="root" :class="prefix" :role="namedRole($attrs)" :style="rootStyle">
        <template v-if="isScroll">
            <slot v-if="props.overflowRenderDirection !== 'end'" :items="scrollOverflow[0]" name="overflow" position="start" />
            <slot v-if="props.overflowRenderDirection === 'start'" :items="scrollOverflow[1]" name="overflow" position="end" />
            <div ref="wrapper" v-bind="props.wrapperProps" :class="[props.wrapperClassName, cssClasses.SCROLL_WRAPPER]" :style="props.wrapperStyle">
                <component :is="entry.node" v-for="entry in scrollItems()" :key="entry.key" v-bind="{ [SCROLL_KEY_ATTRIBUTE]: entry.key }" />
            </div>
            <slot v-if="props.overflowRenderDirection === 'end'" :items="scrollOverflow[0]" name="overflow" position="start" />
            <slot v-if="props.overflowRenderDirection !== 'start'" :items="scrollOverflow[1]" name="overflow" position="end" />
        </template>
        <template v-else>
            <template v-for="(nodes, n) in [overflowNodes()]" :key="n">
                <MeasuredBox v-if="props.collapseFrom === 'start' && nodes.length" :class="`${prefix}-overflow`" @resize="onOverflowResize">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </MeasuredBox>
                <MeasuredBox v-for="entry in collapseItems" :key="entry.key ?? entry.index" :class="`${prefix}-item`" @resize="onItemResize($event, entry.key)">
                    <slot :index="entry.index" :item="entry.item" name="item" />
                </MeasuredBox>
                <MeasuredBox v-if="props.collapseFrom === 'end' && nodes.length" :class="`${prefix}-overflow`" @resize="onOverflowResize">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </MeasuredBox>
            </template>
        </template>
    </div>
</template>
