<script setup lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        title: 'Hi, Bytedance',
        content: 'Hi, Bytedance dance dance',
        duration: 3,
        theme: 'light',
    } as const;
</script>

<template>
    <Button @click="Notification.info(opts)">Info</Button>
    <br />
    <br />
    <Button @click="Notification.success(opts)">Success</Button>
    <br />
    <br />
    <Button type="warning" @click="Notification.warning(opts)">Warning</Button>
    <br />
    <br />
    <Button type="danger" @click="Notification.error(opts)">Error</Button>
</template>
