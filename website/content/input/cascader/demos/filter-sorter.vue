<script setup lang="ts">
    import { Cascader, type CascaderProps } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: 'Product',
            value: 'Product',
            children: [
                { label: 'Semi-Material', value: 'Semi-Material' },
                { label: 'Semi-DSM', value: 'Semi-DSM' },
                { label: 'Semi', value: 'Semi' },
                { label: 'Semi-C2D', value: 'Semi-C2D' },
                { label: 'Semi-D2C', value: 'Semi-D2C' },
            ],
        },
    ];

    // The sorter receives the two result paths, so compare their last nodes
    const filterSorter: CascaderProps['filterSorter'] = (first, second, inputValue) => {
        const firstData = first[first.length - 1];
        const lastData = second[second.length - 1];
        if (firstData.label === inputValue) {
            return -1;
        } else if (lastData.label === inputValue) {
            return 1;
        } else {
            return firstData.label < lastData.label ? -1 : 1;
        }
    };
</script>

<template>
    <div>
        <Cascader :filterSorter="filterSorter" filterTreeNode placeholder="输入 s 查看排序效果" :style="{ width: '300px' }" :treeData="treeData" />
    </div>
</template>
