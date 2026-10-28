<script setup lang="ts">
    import { ref } from 'vue';
    import JsonViewer from '../..';

    const changes = ref(0);
    const renders = ref(0);
</script>

<template>
    <JsonViewer modelValue="1" @change="changes++" />
    <output aria-label="changes">{{ changes }}</output>
    <button type="button" @click="renders++">render {{ renders }}</button>
</template>
