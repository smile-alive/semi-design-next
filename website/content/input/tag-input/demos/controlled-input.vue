<script setup lang="ts">
    import { ref } from 'vue';
    import { TagInput } from '@fibrae/semi-ui-vue';

    const value = ref('abc');
</script>

<template>
    <TagInput v-model:inputValue="value" />
</template>
