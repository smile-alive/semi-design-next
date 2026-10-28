<script setup lang="ts">
    import { Tag, TreeSelect } from '@fibrae/semi-ui-vue';

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
        {
            label: '南美洲',
            value: 'South America',
            key: '2',
        },
        {
            label: '南极洲',
            value: 'Antarctica',
            key: '3',
        },
    ];
</script>

<template>
    <h4>单选</h4>
    <TreeSelect style="width: 300px" :treeData="treeData">
        <template #selectedItem="{ item }">{{ item.label }}</template>
    </TreeSelect>
    <h4>多选 + 标签内渲染</h4>
    <TreeSelect multiple style="width: 300px" :treeData="treeData">
        <template #selectedItem="{ item }">{{ item.label }}</template>
    </TreeSelect>
    <h4>多选 + 替换整个标签</h4>
    <TreeSelect :maxTagCount="2" multiple style="width: 300px" :treeData="treeData">
        <template #tag="{ item, onClose }">
            <Tag closable color="white" @close="onClose">{{ item.value }}</Tag>
        </template>
    </TreeSelect>
</template>
