<script setup lang="ts">
    import { ref } from 'vue';
    import JsonViewer from '../..';

    const text = ref('1');
</script>

<template>
    <JsonViewer v-model="text" />
    <output aria-label="text">{{ text }}</output>
    <button type="button" @click="text = 'other'">reset</button>
</template>
