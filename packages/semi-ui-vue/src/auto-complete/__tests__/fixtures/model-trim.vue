<script setup lang="ts">
    import { ref } from 'vue';
    import AutoComplete from '../..';

    const value = ref<string | number>('');
</script>

<template>
    <AutoComplete v-model.trim="value" aria-label="trim" :data="['semi', 'design']" :motion="false" />
    <span data-testid="trim-value">{{ JSON.stringify(value) }}</span>
</template>
