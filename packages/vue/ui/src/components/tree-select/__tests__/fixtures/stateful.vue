<script setup lang="ts">
    import { ref, useSlots } from 'vue';
    import type { TreeNodeData } from '@fibrae/semi-ui-vue/tree/index';
    import TreeSelect, { type TreeSelectValue } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{
        initialValue?: TreeSelectValue | TreeSelectValue[];
        initialExpandedKeys?: string[];
        initialData: TreeNodeData[];
        multiple?: boolean;
    }>();
    const value = ref(props.initialValue);
    const expandedKeys = ref(props.initialExpandedKeys);
    const data = ref(props.initialData);
    const slots = useSlots();
    const forwarded = () => Object.keys(slots);
    defineExpose({ value, expandedKeys, data });
</script>

<template>
    <TreeSelect v-model="value" v-model:expandedKeys="expandedKeys" :motion="false" :motionExpand="false" :multiple="props.multiple" :treeData="data" v-bind="$attrs">
        <template v-for="name in forwarded()" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </TreeSelect>
    <span data-testid="value">{{ JSON.stringify(value) }}</span>
</template>
