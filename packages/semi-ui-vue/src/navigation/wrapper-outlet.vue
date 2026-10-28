<script setup lang="ts">
    import type { VNode } from 'vue';
    import slotNodes from '../_base/slot-nodes';
    import { useNav } from './context';
    import type { NavItemProps, SubNavProps } from './interface';

    // Hands the item's li to the Nav's #wrapper slot when there is one; otherwise the li is the single root.
    // Known limit: a #wrapper added or removed at runtime reaches only items that re-render; count slot changes in the
    // context view if such a use appears.
    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ isInSubNav: boolean; isSubNav: boolean; itemProps: NavItemProps | SubNavProps }>();
    const slots = defineSlots<{ default: () => VNode[] }>();

    const ctx = useNav('Nav.Item');

    const itemElement = () => slots.default()[0];

    const wrapped = () =>
        slotNodes(
            ctx.wrapper()?.({
                itemElement: itemElement(),
                isSubNav: props.isSubNav,
                isInSubNav: props.isInSubNav,
                // the props proxy lists every declared key; hand out only the ones that were set
                props: Object.fromEntries(Object.entries(props.itemProps).filter(([, value]) => value !== undefined)),
            }) ?? []
        );
</script>

<template>
    <component :is="itemElement()" v-if="!ctx.wrapper()" />
    <template v-else>
        <component :is="node" v-for="[node, key] in wrapped()" :key="key" />
    </template>
</template>
