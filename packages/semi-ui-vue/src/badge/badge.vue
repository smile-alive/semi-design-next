<script setup lang="ts">
    import { Text, computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/badge/constants';
    import '@fibrae/semi-foundation/badge/badge.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useConfig from '../config-provider/use-config';
    import type { BadgeProps, BadgeSlots } from './interface';

    const props = withDefaults(defineProps<BadgeProps & /* @vue-ignore */ ElementProps<'span', keyof BadgeProps>>(), {
        count: semiGlobalDefault('Badge', 'count'),
        dot: () => semiDefault('Badge', 'dot', false),
        type: () => semiDefault('Badge', 'type', 'primary'),
        theme: () => semiDefault('Badge', 'theme', 'solid'),
        position: semiGlobalDefault('Badge', 'position'),
        overflowCount: semiGlobalDefault('Badge', 'overflowCount'),
        countClassName: semiGlobalDefault('Badge', 'countClassName'),
        countStyle: semiGlobalDefault('Badge', 'countStyle'),
    });

    const slots = defineSlots<BadgeSlots>();

    const config = useConfig();

    const prefixCls = cssClasses.PREFIX;
    const position = computed(() => props.position ?? (config.value.direction === 'rtl' ? 'leftTop' : 'rightTop'));

    // An overflowCount of 0 means unset, and only numbers overflow: a string count is shown as given.
    const content = computed(() => (typeof props.count === 'number' && props.overflowCount && props.overflowCount < props.count ? `${props.overflowCount}+` : props.count));

    const children = (): KeyedNode[] => slotNodes(slots.default?.() ?? []).filter(([node]) => !(node.type === Text && node.children === ''));
</script>

<template>
    <span :class="prefixCls">
        <template v-for="(nodes, i) in [children()]" :key="i">
            <component :is="node" v-for="[node, key] in nodes" :key="key" />
            <span
                :class="[
                    props.countClassName,
                    {
                        [`${prefixCls}-${props.type}`]: !$slots.count,
                        [`${prefixCls}-${props.theme}`]: !$slots.count,
                        [`${prefixCls}-${position}`]: nodes.length,
                        [`${prefixCls}-block`]: !nodes.length,
                        [`${prefixCls}-dot`]: props.dot,
                        [`${prefixCls}-count`]: !props.dot && !$slots.count && props.count != null,
                        [`${prefixCls}-custom`]: $slots.count,
                    },
                ]"
                :style="props.countStyle"
                x-semi-prop="count"
            >
                <slot v-if="!props.dot" name="count">{{ content }}</slot>
            </span>
        </template>
    </span>
</template>
