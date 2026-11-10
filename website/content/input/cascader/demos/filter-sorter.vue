<script setup lang="ts">
    import { Cascader } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: 'Product',
            value: 'Product',
            children: [
                { label: 'Semi-Material', value: 'Semi-Material' },
                { label: 'Semi-Theme', value: 'Semi-Theme' },
                { label: 'Semi', value: 'Semi' },
                { label: 'Semi-C2D', value: 'Semi-C2D' },
                { label: 'Semi-Icons', value: 'Semi-Icons' },
            ],
        },
    ];
</script>

<template>
    <div>
        <Cascader
            :filterSorter="
                (first, second, inputValue) => {
                    const firstData = first[first.length - 1];
                    const lastData = second[second.length - 1];
                    if (firstData.label === inputValue) {
                        return -1;
                    } else if (lastData.label === inputValue) {
                        return 1;
                    } else {
                        return String(firstData.label) < String(lastData.label) ? -1 : 1;
                    }
                }
            "
            filterTreeNode
            placeholder="输入 s 查看排序效果"
            :style="{ width: '300px' }"
            :treeData="treeData"
        />
    </div>
</template>
