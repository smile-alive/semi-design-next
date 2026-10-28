<script setup lang="ts">
    import { Button, ButtonGroup, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        duration: 3,
        position: 'topRight',
        content: 'semi-ui-notification',
        title: 'Hi bytedance',
    } as const;
</script>

<template>
    <ButtonGroup>
        <Button @click="Notification.info({ ...opts, position: 'top' })">top</Button>
        <Button @click="Notification.info({ ...opts, position: 'topLeft' })">topLeft</Button>
        <Button @click="Notification.info(opts)">topRight</Button>
    </ButtonGroup>
    <br />
    <br />
    <ButtonGroup>
        <Button @click="Notification.info({ ...opts, position: 'bottom' })">bottom</Button>
        <Button @click="Notification.info({ ...opts, position: 'bottomRight' })">bottomRight</Button>
        <Button @click="Notification.info({ ...opts, position: 'bottomLeft' })">bottomLeft</Button>
    </ButtonGroup>
</template>
