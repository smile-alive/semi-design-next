<script setup lang="ts">
    import { Space, Tag, Tooltip } from '@fibrae/semi-ui-vue';

    const style = {
        border: '2px solid var(--semi-color-border)',
        paddingLeft: '4px',
        paddingRight: '4px',
        borderRadius: '4px',
    };
</script>

<template>
    <Space>
        <Tooltip>
            <Tag :style="style">Component</Tag>
            <template #content>semi design</template>
        </Tooltip>
        <Tooltip>
            Text
            <template #content>semi design</template>
        </Tooltip>
        <Tooltip>
            <span :style="style">DOM</span>
            <template #content>semi design</template>
        </Tooltip>
    </Space>
</template>
