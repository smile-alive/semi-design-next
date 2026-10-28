<script setup lang="ts">
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    function show() {
        const id = Notification.open({
            title: 'Hi, Bytedance',
            content: 'ies dance dance dance',
            duration: 3,
        });
        setTimeout(() => {
            Notification.open({
                title: 'Hi, Bytedance',
                content: 'updated',
                duration: 10,
                id,
            });
        }, 1000);
    }
</script>

<template>
    <Button @click="show">Display Notification</Button>
</template>
