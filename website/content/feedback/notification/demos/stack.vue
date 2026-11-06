<script setup lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const show = () => {
        Notification.info({ title: 'Hi', content: 'Hi, Bytedance dance dance', duration: 10, stack: true });
    };
</script>

<template>
    <Button @click="show">Click multiple times</Button>
</template>
