<script setup lang="ts">
    import { h } from 'vue';
    import { Button, Notification, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;

    // content is a VNode or a render function, which a template cannot express
    const opts = {
        title: 'This is a title',
        content: () => [h('div', 'Hi, Bytedance dance dance'), h('div', { style: { marginTop: '8px' } }, [h(Text, { link: true }, () => '查看详情'), h(Text, { link: true, style: { marginLeft: '20px' } }, () => '一会再看')])],
        duration: 3,
    };
</script>

<template>
    <Button @click="Notification.info(opts)">Display Notification</Button>
</template>
