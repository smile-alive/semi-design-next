<script setup lang="ts">
    import { ref } from 'vue';
    import Cascader, { type CascaderData, type CascaderValue } from '../..';

    // Nothing falls through to the Cascader: mergeProps drops a valueless attribute whose name starts with "on"
    defineOptions({ inheritAttrs: false });
    defineProps<{ data: CascaderData[] }>();
    const value = ref<CascaderValue>();
    defineExpose({ value });
</script>

<template>
    <Cascader v-model="value" :auto-merge-value="false" change-with-object filter-tree-node :motion="false" multiple show-clear :tree-data="data" />
</template>
