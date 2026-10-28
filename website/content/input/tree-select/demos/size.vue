<script setup lang="ts">
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
                        { label: '北京', value: 'Beijing', key: '0-0-0' },
                        { label: '上海', value: 'Shanghai', key: '0-0-1' },
                    ],
                },
            ],
        },
        { label: '北美洲', value: 'North America', key: '1' },
    ];

    const dropdownStyle = { maxHeight: '400px', overflow: 'auto' };
</script>

<template>
    <div>
        <TreeSelect :dropdownStyle="dropdownStyle" multiple placeholder="small" size="small" style="width: 300px" :treeData="treeData" />
        <br />
        <br />
        <TreeSelect :dropdownStyle="dropdownStyle" multiple placeholder="default" size="default" style="width: 300px" :treeData="treeData" />
        <br />
        <br />
        <TreeSelect :dropdownStyle="dropdownStyle" multiple placeholder="large" size="large" style="width: 300px" :treeData="treeData" />
    </div>
</template>
