<script setup lang="ts">
    import { h } from 'vue';
    import { Button, Toast, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;

    // content is a VNode or a render function, which a template cannot express
    const opts = {
        content: () => h('span', [h(Text, () => 'Hi, Bytedance dance dance'), h(Text, { link: true, style: { marginLeft: '12px' } }, () => '更多')]),
        duration: 3,
    };

    const multiLineOpts = {
        content: () => [h('div', 'Hi, Bytedance dance dance'), h('div', { style: { marginTop: '8px' } }, [h(Text, { link: true }, () => '查看详情'), h(Text, { link: true, style: { marginLeft: '20px' } }, () => '一会再看')])],
        duration: 3,
    };
</script>

<template>
    <Button @click="Toast.info(opts)">Display Toast</Button>
    <br />
    <br />
    <Button @click="Toast.info(multiLineOpts)">Display Multi-line Toast</Button>
</template>
