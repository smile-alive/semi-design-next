<script setup lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
    };
</script>

<template>
    <Button @click="Toast.info(opts)">Close After 10s</Button>
</template>
