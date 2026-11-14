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
    <div>
        <TreeSelect disabled placeholder="禁用下拉菜单" style="width: 300px" :styles="{ dropdown: { maxHeight: '400px', overflow: 'auto' } }" :treeData="treeData" />
        <br />
        <br />
        <TreeSelect defaultValue="Shanghai" disabled style="width: 300px" :styles="{ dropdown: { maxHeight: '400px', overflow: 'auto' } }" :treeData="treeData" />
        <br />
        <br />
        <TreeSelect :defaultValue="['Shanghai', 'North America']" disabled multiple style="width: 300px" :styles="{ dropdown: { maxHeight: '400px', overflow: 'auto' } }" :treeData="treeData" />
    </div>
</template>
