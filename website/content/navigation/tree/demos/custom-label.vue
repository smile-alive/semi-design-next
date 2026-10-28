<script setup lang="ts">
    import { Tag, Tree } from '@fibrae/semi-ui-vue';

    // Node content is display-only: focus stays on the tree, so buttons and links inside are keyboard-unreachable
    const treeData = [
        {
            label: '亚洲',
            value: 'yazhou',
            key: 'yazhou',
            children: [
                {
                    label: '中国',
                    value: 'zhongguo',
                    key: 'zhongguo',
                },
                {
                    label: '日本',
                    value: 'riben',
                    key: 'riben',
                },
            ],
        },
    ];
    const labelStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };
    const treeStyle = {
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };
</script>

<template>
    <Tree :style="treeStyle" :treeData="treeData">
        <template #label="{ item, label }">
            <div :style="labelStyle">
                <span>{{ label }}</span>
                <Tag size="small">{{ item.children ? '大洲' : '国家' }}</Tag>
            </div>
        </template>
    </Tree>
</template>
