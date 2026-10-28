<script setup lang="ts">
    import { ref, shallowRef } from 'vue';
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const value = ref<string>();
    const treeData = shallowRef<TreeNodeData[]>([]);

    function onSearch(inputValue: string) {
        if (!inputValue) {
            treeData.value = [];
            return;
        }

        setTimeout(() => {
            treeData.value = [
                { label: `${inputValue} - 结果1`, value: `${inputValue}-1`, key: `${inputValue}-1` },
                { label: `${inputValue} - 结果2`, value: `${inputValue}-2`, key: `${inputValue}-2` },
                { label: `${inputValue} - 结果3`, value: `${inputValue}-3`, key: `${inputValue}-3` },
            ];
        }, 500);
    }
</script>

<template>
    <TreeSelect v-model="value" filterTreeNode placeholder="请输入关键字进行远程搜索" remote style="width: 300px" :treeData="treeData" @search="onSearch" />
</template>
