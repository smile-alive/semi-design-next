<script setup lang="ts">
    import { TreeSelect } from '@fibrae/semi-ui-vue';

    const treeData = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: 'Beijing',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: 'Shanghai',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                        {
                            label: 'Chengdu',
                            value: 'Chengdu',
                            key: '0-0-2',
                        },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [
                        {
                            label: 'Osaka',
                            value: 'Osaka',
                            key: '0-1-0',
                        },
                    ],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                {
                    label: 'United States',
                    value: 'United States',
                    key: '1-0',
                },
                {
                    label: 'Canada',
                    value: 'Canada',
                    key: '1-1',
                },
            ],
        },
    ];
</script>

<template>
    <div>
        <TreeSelect multiple placeholder="请选择" style="width: 300px" :styles="{ dropdown: { maxHeight: '400px', overflow: 'auto' } }" :treeData="treeData" />
        <br />
        <br />
        <TreeSelect leafOnly multiple placeholder="只渲染叶子节点" style="width: 300px" :styles="{ dropdown: { maxHeight: '400px', overflow: 'auto' } }" :treeData="treeData" />
        <br />
        <br />
    </div>
</template>
