<script setup lang="ts">
    import { reactive } from 'vue';
    import HotKeys from '../../index';

    const keys = reactive(['k']);
    defineExpose({ push: (key: string) => keys.push(key) });
</script>

<template>
    <HotKeys :hotKeys="keys" />
</template>
