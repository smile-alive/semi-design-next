<script setup lang="ts">
    import { Text, computed, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/breadcrumb/constants';
    import BreadcrumbItemFoundation, { type BreadcrumbItemAdapter } from '@fibrae/semi-foundation/breadcrumb/item-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import type { ElementProps } from '../_base/element-props';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import { iconAttrs } from '../navigation/nav-icon';
    import slotText from '../typography/slot-text';
    import TypographyText from '../typography/text.vue';
    import { useBreadcrumbContext } from './context';
    import type { BreadcrumbItemProps, BreadcrumbItemSlots, ShowTooltipProps } from './interface';

    type ItemState = Record<string, never>;
    type Foundation = BreadcrumbItemFoundation<BreadcrumbItemProps, ItemState, MouseEvent>;
    type Adapter = BreadcrumbItemAdapter<BreadcrumbItemProps, ItemState, MouseEvent>;

    // A static subcomponent: it reads no global defaults, as in React.
    defineOptions({ name: 'BreadcrumbItem', elementType: 'Breadcrumb.Item' });

    const props = withDefaults(defineProps<BreadcrumbItemProps & /* @vue-ignore */ ElementProps<'span', keyof BreadcrumbItemProps>>(), {
        active: undefined,
        href: undefined,
        noLink: undefined,
        route: undefined,
        separator: undefined,
        shouldRenderSeparator: true,
        onClick: undefined,
    });

    defineSlots<BreadcrumbItemSlots>();

    // A standalone Item has no Breadcrumb: no tooltip config, no shared separator, nobody to notify.
    const context = useBreadcrumbContext();

    const { foundation } = useFoundation<Foundation, Adapter, BreadcrumbItemProps, ItemState>(
        BreadcrumbItemFoundation,
        props,
        () => ({}),
        () => ({
            notifyClick: (item, e) => props.onClick?.(item, e),
            notifyParent: (item, e) => context?.onClick(item, e),
        })
    );

    const prefix = cssClasses.PREFIX;
    const compact = computed(() => context?.view.value.compact);
    const isLink = computed(() => !props.active && props.href != null);
    const isKeyboardLink = computed(() => BreadcrumbItemFoundation.isKeyboardLink({ active: props.active, hasHref: props.href != null, noLink: props.noLink, hasOnClick: Boolean(props.onClick) || Boolean(context?.view.value.hasOnClick) }));
    const tooltip = computed<ShowTooltipProps>(() => BreadcrumbItemFoundation.getTooltipConfig(context?.view.value.showTooltip));

    // A route without a name renders `{{ undefined }}`, an empty text node that is no title.
    const titleNodes = (nodes: VNode[]) => slotNodes(nodes).filter(([node]) => node.type !== Text || node.children !== '');

    // Only plain text (numbers included) is truncated; elements keep their markup inline.
    const isText = (nodes: KeyedNode[]) => nodes.every(([node]) => node.type === Text);

    const iconProps = (node: VNode) => iconAttrs(node, compact.value ? 'small' : 'default', `${prefix}-item-icon`);

    const separatorNodes = () => slotNodes(context?.separatorSlot() ?? []);

    // The title text is read in render and passed in: calling the slot in the handler would run it outside render.
    const handleClick = (e: MouseEvent, nodes: KeyedNode[]) => {
        const info = props.route ?? { name: slotText(nodes).text, ...(props.href != null && { href: props.href }) };
        foundation.handleClick(info, e);
    };

    const handleKeydown = (e: KeyboardEvent) => foundation.handleKeyDown(e as KeyboardEvent & { currentTarget: HTMLElement }, isKeyboardLink.value);
</script>

<template>
    <span :aria-current="props.active ? 'page' : undefined" :class="`${prefix}-item-wrap`">
        <template v-for="(nodes, n) in [titleNodes($slots.default?.() ?? [])]" :key="n">
            <component
                :is="isLink ? 'a' : 'span'"
                :class="[`${prefix}-item`, { [`${prefix}-item-active`]: props.active, [`${prefix}-item-link`]: !props.noLink }]"
                :href="isLink ? props.href : undefined"
                :role="isKeyboardLink ? 'link' : undefined"
                :tabindex="isKeyboardLink ? 0 : undefined"
                @click="handleClick($event, nodes)"
                @keydown="handleKeydown"
            >
                <component :is="node" v-for="[node, key] in slotNodes($slots.icon?.() ?? [])" :key="key" v-bind="iconProps(node)" />
                <span v-if="nodes.length > 0 && isText(nodes)" :class="`${prefix}-item-title`">
                    <TypographyText
                        :ellipsis="{
                            showTooltip: tooltip.opts ? { opts: tooltip.opts } : false,
                            pos: tooltip.ellipsisPos,
                        }"
                        :size="compact ? 'small' : 'normal'"
                        :style="{ maxWidth: toCssLength(tooltip.width) }"
                        >{{ slotText(nodes).text }}</TypographyText
                    >
                </span>
                <span v-else-if="nodes.length > 0" :class="[`${prefix}-item-title`, `${prefix}-item-title-inline`]">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </span>
            </component>
        </template>
        <template v-if="props.shouldRenderSeparator">
            <slot v-if="$slots.separator" name="separator" />
            <template v-else-if="props.separator">{{ props.separator }}</template>
            <span v-else :class="`${prefix}-separator`">
                <template v-for="(nodes, s) in [separatorNodes()]" :key="s">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                    <template v-if="nodes.length === 0">{{ context?.view.value.separator }}</template>
                </template>
            </span>
        </template>
    </span>
</template>
