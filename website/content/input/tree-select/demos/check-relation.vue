<script setup lang="ts">
    import { TreeSelect } from '@fibrae/semi-ui-vue';

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
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];
</script>

<template>
    <TreeSelect checkRelation="unRelated" :defaultValue="['Asia']" :dropdownStyle="{ maxHeight: '400px', overflow: 'auto' }" multiple style="width: 300px" :treeData="treeData" />
</template>
