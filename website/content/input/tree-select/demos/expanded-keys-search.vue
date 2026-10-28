<script setup lang="ts">
    import { ref } from 'vue';
    import { TreeSelect } from '@fibrae/semi-ui-vue';

    const expandedKeys = ref<string[]>([]);
    const treeData = [
        {
            label: '亚洲',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: '中国',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: '北京',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: '上海',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
                {
                    label: '日本',
                    value: 'Japan',
                    key: '0-1',
                },
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];

    function onSearch(_inputValue: string, filteredExpandedKeys: string[]) {
        expandedKeys.value = [...filteredExpandedKeys, ...expandedKeys.value];
    }
</script>

<template>
    <TreeSelect v-model:expandedKeys="expandedKeys" :dropdownStyle="{ maxHeight: '400px', overflow: 'auto' }" filterTreeNode style="width: 300px" :treeData="treeData" @search="onSearch" />
</template>
