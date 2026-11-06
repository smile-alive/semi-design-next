<script setup lang="ts">
    import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const treeData: TreeNodeData[] = [
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
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];
    const data = shallowRef<TreeNodeData[]>([]);
    let timer: ReturnType<typeof setTimeout> | undefined;

    onMounted(() => {
        timer = setTimeout(() => {
            data.value = treeData;
        }, 500);
    });
    onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
    <TreeSelect expandAll placeholder="expandAll" :style="{ width: '300px', marginBottom: '20px' }" :treeData="data" />
    <TreeSelect defaultExpandAll placeholder="defaultExpandAll" style="width: 300px" :treeData="data" />
</template>
