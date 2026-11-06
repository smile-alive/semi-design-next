<script setup lang="ts">
    import { h } from 'vue';
    import { Button, Notification, Typography } from '@fibrae/semi-ui-vue';

    // content is a VNode or a render function, which a template cannot express
    const opts = {
        title: 'This is a title',
        content: () => [h('div', 'Hi, Bytedance dance dance'), h('div', { style: { marginBlockStart: '8px' } }, [h(Typography.Text, { link: true }, () => '查看详情'), h(Typography.Text, { link: true, style: { marginInlineStart: '20px' } }, () => '一会再看')])],
        duration: 3,
    };
</script>

<template>
    <Button @click="Notification.info(opts)">Display Notification</Button>
</template>
