<script setup lang="ts">
    import { Text, computed, type Slots, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/avatar/constants';
    import type { ElementProps } from '../_base/element-props';
    import { usePopupLayer } from '../_base/popup-layer';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useLocale from '../locale/use-locale';
    import AvatarGroupMore from './avatar-group-more.vue';
    import Avatar from './avatar.vue';
    import { provideAvatarGroupContext } from './context';
    import type { AvatarGroupProps, AvatarGroupSlots } from './interface';
    import getAvatarText from './text';

    defineOptions({ name: 'AvatarGroup' });

    const props = withDefaults(defineProps<AvatarGroupProps & /* @vue-ignore */ ElementProps<'div', keyof AvatarGroupProps>>(), {
        size: () => semiDefault('AvatarGroup', 'size', 'medium'),
        shape: () => semiDefault('AvatarGroup', 'shape', 'circle'),
        overlapFrom: () => semiDefault('AvatarGroup', 'overlapFrom', 'start'),
        maxCount: semiGlobalDefault('AvatarGroup', 'maxCount'),
    });

    defineSlots<AvatarGroupSlots>();

    const locale = useLocale('Avatar');
    const layer = usePopupLayer();

    const prefix = cssClasses.PREFIX;

    provideAvatarGroupContext(computed(() => ({ size: props.size, shape: props.shape, layer })));

    const overlapClass = (index: number) => `${prefix}-item-${props.overlapFrom}-${index}`;

    // Like React's cloneElement, the group's size and shape override its direct children; text stays as is.
    const itemProps = (node: VNode, index: number) =>
        node.type === Text
            ? {}
            : {
                  size: props.size,
                  shape: props.shape,
                  class: overlapClass(index),
                  ...(node.type === Avatar && { role: 'listitem' }),
              };

    const split = (nodes: KeyedNode[]) => {
        const max = props.maxCount;
        return typeof max === 'number' && nodes.length > max ? { visible: nodes.slice(0, max), rest: nodes.slice(max).map(([node]) => node) } : { visible: nodes, rest: [] };
    };

    const nameOf = (node: VNode) => {
        if (node.type === Text) return '';
        const children = typeof node.children === 'string' ? node.children : (node.children as Slots | null)?.default?.();
        if (node.props?.alt) return node.props.alt as string;
        if (typeof children === 'string') return children;
        return getAvatarText(children ?? []) ?? '';
    };

    const moreLabel = (rest: VNode[]) => {
        const label = locale.value.locale.more.replace('${count}', String(rest.length));
        const names = rest.map(nameOf).filter(Boolean).join(',');
        return names ? `${label}: ${names}` : label;
    };
</script>

<template>
    <div :class="`${prefix}-group`" role="list">
        <template v-for="({ visible, rest }, group) in [split(slotNodes($slots.default?.() ?? []))]" :key="group">
            <component :is="node" v-for="([node, key], index) in visible" :key="key" v-bind="itemProps(node, index)" />
            <template v-if="rest.length > 0">
                <AvatarGroupMore v-if="$slots.more" :itemClass="overlapClass(visible.length)" :shape="props.shape" :size="props.size">
                    <slot name="more" :restAvatars="rest" :restNumber="rest.length" />
                </AvatarGroupMore>
                <Avatar v-else :alt="moreLabel(rest)" :class="[`${prefix}-item-more`, overlapClass(visible.length)]" role="listitem" :shape="props.shape" :size="props.size">+{{ rest.length }}</Avatar>
            </template>
        </template>
    </div>
</template>
