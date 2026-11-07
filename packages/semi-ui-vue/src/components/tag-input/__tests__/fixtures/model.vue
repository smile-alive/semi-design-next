<script setup lang="ts">
    import { ref } from 'vue';
    import TagInput from '../..';

    const tags = ref<string[] | undefined>(['a']);
    const text = ref('');
</script>

<template>
    <TagInput v-model="tags" v-model:inputValue="text" showClear />
    <span data-testid="tags">{{ JSON.stringify(tags) }}</span>
    <span data-testid="text">{{ text }}</span>
    <button type="button" @click="tags = ['x', 'y']">set</button>
    <button type="button" @click="tags = undefined">reset</button>
</template>
