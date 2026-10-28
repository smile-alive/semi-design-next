<script setup lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 3,
    };
</script>

<template>
    <Button style="color: var(--semi-color-success)" @click="Toast.success('Hi,Bytedance dance dance')"> Success </Button>
    <br />
    <br />
    <Button type="warning" @click="Toast.warning(opts)">Warning</Button>
    <br />
    <br />
    <Button type="danger" @click="Toast.error(opts)">Error</Button>
</template>
