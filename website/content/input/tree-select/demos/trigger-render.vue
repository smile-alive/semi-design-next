<script setup lang="ts">
    import { Tag, TagInput, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const treeData: TreeNodeData[] = [
        {
            label: '亚洲',
            value: '亚洲',
            key: '0',
            children: [
                {
                    label: '中国',
                    value: '中国',
                    key: '0-0',
                    children: [
                        { label: '北京', value: '北京', key: '0-0-0' },
                        { label: '上海', value: '上海', key: '0-0-1' },
                    ],
                },
            ],
        },
        { label: '北美洲', value: '北美洲', key: '1' },
    ];

    function onChange(value: unknown) {
        console.log('onChange', value);
    }
</script>

<template>
    <TreeSelect filterTreeNode multiple placeholder="Custom Trigger" searchPosition="trigger" style="width: 300px" :treeData="treeData" @change="onChange">
        <template #trigger="{ value, inputValue, onSearch, onRemove }">
            <TagInput :inputValue="inputValue" :modelValue="value.flatMap((item) => item.key ?? [])" @inputChange="onSearch">
                <template #tag="{ value: key }">
                    <Tag :key="key" closable style="margin-inline-start: 2px" :tagKey="key" @close="onRemove(key)">
                        {{ value.find((item) => item.key === key)?.label }}
                    </Tag>
                </template>
            </TagInput>
        </template>
    </TreeSelect>
</template>
