<script setup lang="ts">
    import { throttle } from 'es-toolkit';
    import { Button, Toast } from '@fibrae/semi-ui-vue';

    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 3,
        stack: true,
    };
    const throttleOpts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        onClose: () => throttled.cancel(),
        stack: true,
    };
    const throttled = throttle(() => Toast.info(throttleOpts), 10000, { edges: ['leading'] });
</script>

<template>
    <div>
        <Button @click="Toast.info(opts)">Display Toast</Button>
        <br />
        <br />
        <Button @click="throttled">Throttled Toast</Button>
    </div>
</template>
