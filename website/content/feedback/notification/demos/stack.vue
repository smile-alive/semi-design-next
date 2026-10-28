<script setup lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        title: 'Hi',
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        stack: true,
    };
</script>

<template>
    <Button @click="Notification.info(opts)">Click multiple times</Button>
</template>
