<script setup lang="ts">
    import { h } from 'vue';
    import { Button, Toast, Typography } from '@fibrae/semi-ui-vue';

    // content is a VNode or a render function, which a template cannot express
    const opts = {
        content: () => h('span', [h(Typography.Text, () => 'Hi, Semi dance dance'), h(Typography.Text, { link: true, style: { marginInlineStart: '12px' } }, () => '更多')]),
        duration: 3,
    };

    const multiLineOpts = {
        content: () => [h('div', 'Hi, Semi dance dance'), h('div', { style: { marginBlockStart: '8px' } }, [h(Typography.Text, { link: true }, () => '查看详情'), h(Typography.Text, { link: true, style: { marginInlineStart: '20px' } }, () => '一会再看')])],
        duration: 3,
    };
</script>

<template>
    <Button @click="Toast.info(opts)">Display Toast</Button>
    <br />
    <br />
    <Button @click="Toast.info(multiLineOpts)">Display Multi-line Toast</Button>
</template>
