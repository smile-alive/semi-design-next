<script setup lang="ts">
    import { ref } from 'vue';
    import TreeSelect from '../..';
    import type { TreeNodeData } from '../../../tree';

    // `multiple` arrives as '' because the generic Multiple gives Vue no Boolean type to cast it with
    defineOptions({ inheritAttrs: false });
    defineProps<{ data: TreeNodeData[] }>();
    const value = ref<TreeNodeData[]>();
    defineExpose({ value });
</script>

<template>
    <TreeSelect v-model="value" change-with-object default-expand-all default-open filter-tree-node :motion="false" :motion-expand="false" multiple search-position="trigger" show-clear :tree-data="data" />
</template>
