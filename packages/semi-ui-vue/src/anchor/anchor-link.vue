<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, watch, type Slots, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/anchor/constants';
    import AnchorFoundation, { type AnchorNode } from '@fibrae/semi-foundation/anchor/foundation';
    import isEnterPress from '@fibrae/semi-foundation/utils/is-enter-press';
    import type { ElementProps } from '../_base/element-props';
    import elementType from '../_base/element-type';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import { elementChildren } from '../typography/slot-text';
    import TypographyText from '../typography/text.vue';
    import { provideAnchorContext, useAnchorContext } from './context';
    import type { AnchorClickEvent, AnchorLinkSlots, LinkProps } from './interface';

    defineOptions({ name: 'AnchorLink', elementType: 'Anchor.Link' });

    const props = withDefaults(defineProps<LinkProps & /* @vue-ignore */ ElementProps<'div', keyof LinkProps>>(), {
        disabled: false,
        href: '#',
        title: undefined,
    });

    defineSlots<AnchorLinkSlots>();

    const parent = useAnchorContext('Anchor.Link');

    const { level, view, onClick } = parent;
    const prefix = cssClasses.PREFIX;
    const active = computed(() => view.value.activeLink === props.href);

    const tooltip = computed(() => {
        const { showTooltip, position } = view.value;
        const config = typeof showTooltip === 'object' ? showTooltip : {};
        // The position can be set through showTooltip; a copy keeps the caller's object as it was
        return { ...config, opts: position ? { ...config.opts, position } : { ...config.opts } };
    });

    provideAnchorContext({ ...parent, level: level + 1 });

    /**
     * The links below the given slot nodes. Collapsed branches are not mounted, so whether a branch holds the active link
     * is read from the slot vnodes. Only Anchor.Link, fragments and native elements are walked: another component's
     * default slot may take scope arguments and cannot be called without them.
     */
    const linkTree = (nodes: KeyedNode[]): AnchorNode[] => {
        return nodes.flatMap(([node]): AnchorNode[] => {
            if (elementType(node) === 'Anchor.Link') {
                const slots = node.children !== null && typeof node.children === 'object' && !Array.isArray(node.children) ? (node.children as Slots) : undefined;
                return [
                    {
                        href: node.props?.href as string | undefined,
                        children: linkTree(slotNodes(slots?.default?.() ?? [])),
                    },
                ];
            }
            return typeof node.type === 'string' ? linkTree(elementChildren(node)) : [];
        });
    };

    const expanded = (nodes: VNode[]) => !view.value.autoCollapse || active.value || Boolean(AnchorFoundation.getChildMap([{ href: props.href, children: linkTree(slotNodes(nodes)) }])[props.href]?.has(view.value.activeLink));

    const handleClick = (e: AnchorClickEvent) => {
        if (!props.disabled) {
            onClick(e, props.href);
        }
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (isEnterPress(e)) {
            // otherwise the same Enter also presses a button that the click handler moved focus to
            e.preventDefault();
            handleClick(e);
        }
    };

    watch(
        () => props.href,
        (next, prev) => {
            parent.removeLink(prev);
            parent.addLink(next);
        }
    );

    // Scroll highlighting reads the mounted links from the foundation state; children mount first, so Anchor's init
    // already sees them.
    onMounted(() => parent.addLink(props.href));
    onBeforeUnmount(() => parent.removeLink(props.href));
</script>

<template>
    <div :class="`${prefix}-link`" role="listitem">
        <div
            :aria-current="active ? 'location' : undefined"
            :aria-disabled="props.disabled"
            :class="[
                `${prefix}-link-title`,
                {
                    [`${prefix}-link-title-active`]: active,
                    [`${prefix}-link-title-disabled`]: props.disabled,
                },
            ]"
            role="link"
            :style="{ paddingInlineStart: `${8 * level}px` }"
            tabindex="0"
            :title="(!view.showTooltip && !$slots.title && props.title) || undefined"
            @click="handleClick"
            @keydown="handleKeydown"
        >
            <!-- the link title is the Tab stop; the ellipsis Tooltip would add 0 to the text -->
            <TypographyText
                v-if="view.showTooltip"
                :class="[
                    `${prefix}-link-tooltip`,
                    {
                        [`${prefix}-link-tooltip-small`]: view.size === 'small',
                        [`${prefix}-link-tooltip-active`]: active,
                        [`${prefix}-link-tooltip-disabled`]: props.disabled,
                    },
                ]"
                :ellipsis="{ showTooltip: tooltip }"
                :size="view.size === 'default' ? 'normal' : 'small'"
                tabindex="-1"
                type="tertiary"
            >
                <slot name="title">{{ props.title }}</slot>
            </TypographyText>
            <slot v-else name="title">{{ props.title }}</slot>
        </div>
        <template v-for="(nodes, n) in [$slots.default?.() ?? []]" :key="n">
            <div v-if="expanded(nodes)" role="list">
                <component :is="node" v-for="[node, key] in slotNodes(nodes)" :key="key" />
            </div>
        </template>
    </div>
</template>
