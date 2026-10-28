<script setup lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        title: 'Hi, Bytedance',
        content: 'ies dance dance dance',
        duration: 3,
    };
</script>

<template>
    <Button @click="Notification.open(opts)">Display Notification</Button>
</template>
