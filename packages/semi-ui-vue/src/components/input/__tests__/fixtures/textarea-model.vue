<script setup lang="ts">
    import { ref } from 'vue';
    import { TextArea } from '../..';

    const text = ref('');
    const trimmed = ref('');
</script>

<template>
    <TextArea v-model="text" aria-label="model" />
    <TextArea v-model.trim="trimmed" aria-label="trim" />
    <span data-testid="trim-value">{{ JSON.stringify(trimmed) }}</span>
    <span data-testid="model-value">{{ text }}</span>
    <button type="button" @click="text = 'parent'">set</button>
</template>
