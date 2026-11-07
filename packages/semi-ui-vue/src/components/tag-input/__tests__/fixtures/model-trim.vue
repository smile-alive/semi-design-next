<script setup lang="ts">
    import { ref } from 'vue';
    import TagInput from '../..';

    const text = ref('');
</script>

<template>
    <TagInput v-model:inputValue.trim="text" aria-label="trim" />
    <span data-testid="trim-value">{{ JSON.stringify(text) }}</span>
</template>
