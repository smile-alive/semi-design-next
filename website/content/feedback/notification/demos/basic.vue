<script setup lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const show = () =>
        Notification.open({
            title: 'Hi, Bytedance',
            content: 'ies dance dance dance',
            duration: 3,
        });
</script>

<template>
    <Button @click="show">Display Notification</Button>
</template>
