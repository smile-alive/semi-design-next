<script setup lang="ts">
    import { Button, Space, Tag } from '@fibrae/semi-ui-vue';

    const aligns = ['start', 'center', 'end', 'baseline'] as const;
    const boxStyle = {
        width: '80px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '3px',
    };
</script>

<template>
    <Space vertical>
        <Space v-for="align in aligns" :key="align" :align="align">
            <div :style="boxStyle">文本</div>
            <Button theme="solid" type="primary">按钮</Button>
            <Tag color="green" size="large">标签</Tag>
        </Space>
    </Space>
</template>
