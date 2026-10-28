<script setup lang="ts">
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        stack: true,
    };
</script>

<template>
    <Button @click="Toast.info(opts)">多次点击</Button>
</template>
