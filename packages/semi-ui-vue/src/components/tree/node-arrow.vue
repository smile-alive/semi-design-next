<script setup lang="ts">
    import { normalizeClass, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/tree/constants';
    import { isTreeNodeLeaf } from '@fibrae/semi-foundation/components/tree/shared';
    import { IconTreeTriangleDown } from '@fibrae/semi-icons-vue';
    import { slotNodes, hasSlotContent, type KeyedNode } from '../../utils/index';
    import Spin from '../spin';
    import { useTreeContext } from './context';
    import type { TreeExpandIconSlotProps, TreeRowProps } from './interface';

    const props = defineProps<{ row: TreeRowProps; showLine: boolean }>();
    const emit = defineEmits<{ expand: [event: MouseEvent] }>();
    const slots = defineSlots<{ expandIcon?: (props: TreeExpandIconSlotProps) => VNode[] }>();

    const context = useTreeContext();

    const prefix = cssClasses.PREFIX_OPTION;

    // a custom expand icon takes the part class only: its element is the user's own
    const iconClass = () => normalizeClass([`${prefix}-expand-icon`, context?.view.value.classNames?.itemSwitcher]);

    const switcherClass = (own: string) => [own, context?.view.value.classNames?.itemSwitcher];

    const switcherStyle = () => context?.view.value.styles?.itemSwitcher;

    // One function for the slot parameter and the binding, so an element binding the onClick it receives is clicked once
    const handleClick = (event: MouseEvent) => emit('expand', event);

    const isLeaf = () => isTreeNodeLeaf(props.row, context?.view.value.hasLoadData);

    const iconNodes = (): KeyedNode[] | null => {
        if (!slots.expandIcon) {
            return null;
        }
        const nodes = slots.expandIcon({ onClick: handleClick, class: iconClass(), expanded: Boolean(props.row.expanded) });
        return hasSlotContent(() => nodes) ? slotNodes(nodes) : null;
    };

    const isOneElement = (nodes: KeyedNode[]) => nodes.length === 1 && typeof nodes[0][0].type !== 'symbol';
</script>

<template>
    <!-- the row carries aria-busy; the spinner's own name would join the row's name -->
    <Spin v-if="props.row.loading" aria-hidden="true" :class="switcherClass(`${prefix}-spin-icon`)" :style="switcherStyle()" />
    <template v-else-if="!isLeaf()">
        <template v-for="(nodes, i) in [iconNodes()]" :key="i">
            <component :is="nodes[0][0]" v-if="nodes && isOneElement(nodes)" :class="iconClass()" @click="handleClick" />
            <template v-else-if="nodes">
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </template>
            <IconTreeTriangleDown v-else aria-hidden="true" :class="iconClass()" size="small" :style="switcherStyle()" @click="handleClick" />
        </template>
    </template>
    <span v-else-if="props.showLine" :class="switcherClass(`${prefix}-switcher`)" :style="switcherStyle()">
        <span :class="`${prefix}-switcher-leaf-line`" />
    </span>
    <span v-else :class="switcherClass(`${prefix}-empty-icon`)" :style="switcherStyle()" />
</template>
