<script setup lang="ts">
    import { ref } from 'vue';
    import Input from '../..';

    const text = ref<string | undefined>('');
    const trimmed = ref('');
    const numbered = ref<number | string>('');
</script>

<template>
    <Input v-model="text" aria-label="model" />
    <Input v-model.trim="trimmed" aria-label="trim" />
    <Input v-model.number="numbered" aria-label="number" />
    <span data-testid="number-value">{{ JSON.stringify(numbered) }}</span>
    <span data-testid="model-value">{{ text }}</span>
    <span data-testid="trim-value">{{ JSON.stringify(trimmed) }}</span>
    <button type="button" @click="text = 'parent'">set</button>
    <button type="button" @click="text = undefined">reset</button>
</template>
