<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        content: 'Not auto close',
        title: 'Hi',
        duration: 0,
    };
    const ids = ref<string[]>([]);

    function show() {
        ids.value.push(Notification.info(opts));
    }

    function hide() {
        const first = ids.value.shift();
        if (first) {
            Notification.close(first);
        }
    }
</script>

<template>
    <Button type="primary" @click="show">Show Notification</Button>
    <br />
    <br />
    <Button type="primary" @click="hide">Hide Notification</Button>
</template>
