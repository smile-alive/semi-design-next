<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, type CSSProperties } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import type { ScrollAlign } from '@fibrae/semi-foundation/tree/foundation';
    import { getTransitionNodes, sameKeys } from '@fibrae/semi-foundation/tree/shared';
    import VirtualList from '../_base/virtual-list.vue';
    import useConfig from '../config-provider/use-config';
    import AutoSizer from './auto-sizer.vue';
    import type { FlattenNode, NodeListProps } from './interface';
    import NodeCollapsible from './node-collapsible.vue';

    /**
     * The rows of Tree and TreeSelect. A virtualized list renders the rows in view; otherwise every row renders, with the
     * ones that appear or disappear (motionKeys) grouped into one animated NodeCollapsible.
     */
    const props = withDefaults(defineProps<NodeListProps>(), {
        flattenList: undefined,
        motionType: null,
        virtualize: undefined,
        searchTargetIsDeep: false,
        itemKey: undefined,
    });

    defineSlots<{ default(props: { node: FlattenNode; style: CSSProperties | undefined }): unknown }>();

    const config = useConfig();

    const list = useTemplateRef('list');
    const NO_KEYS: Set<string> = new Set();
    const finished = shallowRef<{ keys: Set<string>; nodes: FlattenNode[] } | null>(null);

    const virtualized = computed(() => Boolean(props.virtualize && Object.keys(props.virtualize).length));

    const transitionNodes = computed(() => {
        const keys = props.motion ? props.motionKeys : NO_KEYS;
        if (!keys.size || props.searchTargetIsDeep) {
            return null;
        }
        const done = finished.value;
        if (done && isEqual(done.keys, keys) && sameKeys(done.nodes, props.flattenNodes)) {
            return null;
        }
        return getTransitionNodes(props.flattenNodes, keys, props.motionType, props.flattenList);
    });

    const handleMotionEnd = () => {
        finished.value = { keys: props.motionKeys, nodes: props.flattenNodes };
    };

    const groupKey = (group: FlattenNode[]) => `motion-${String(group[0].key)}`;

    const rowKey = (node: FlattenNode) => (props.itemKey ? props.itemKey(node) : (node.key as string));

    const itemKeyAt = (index: number) => rowKey(props.flattenNodes[index]);

    defineExpose({
        /** Scrolls a virtualized list to the row; false for a plain list, whose caller scrolls the row element itself */
        scrollToItem: (index: number, align?: ScrollAlign) => {
            if (!list.value) {
                return false;
            }
            list.value.scrollToItem(index, align);
            return true;
        },
    });
</script>

<template>
    <AutoSizer v-if="virtualized && props.virtualize" #default="{ height, width }" :defaultHeight="props.virtualize.height ?? '100%'" :defaultWidth="props.virtualize.width">
        <VirtualList ref="list" :class="`${cssClasses.PREFIX}-virtual-list`" :height="height" :innerAttrs="{ role: 'none' }" :itemCount="props.flattenNodes.length" :itemKey="itemKeyAt" :itemSize="props.virtualize.itemSize" :style="{ direction: config.direction }" :tabindex="-1" :width="width">
            <template #default="{ index, style }">
                <slot :node="props.flattenNodes[index]" :style="style" />
            </template>
        </VirtualList>
    </AutoSizer>
    <!-- one v-for for both, so rows outside the moving group stay mounted when the motion ends -->
    <template v-else>
        <template v-for="item in transitionNodes ?? props.flattenNodes" :key="Array.isArray(item) ? groupKey(item) : rowKey(item)">
            <NodeCollapsible v-if="Array.isArray(item) && item.length" :duration="200" :motion="Boolean(props.motionType)" :open="props.motionType === 'hide'" @motionEnd="handleMotionEnd">
                <template v-for="node in item" :key="rowKey(node)">
                    <slot :node="node" :style="undefined" />
                </template>
            </NodeCollapsible>
            <slot v-else-if="!Array.isArray(item)" :node="item" :style="undefined" />
        </template>
    </template>
</template>
