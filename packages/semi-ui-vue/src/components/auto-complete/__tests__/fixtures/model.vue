<script setup lang="ts">
    import { ref } from 'vue';
    import AutoComplete from '../..';

    const emit = defineEmits<{ order: [name: string] }>();
    const value = ref<string | number>('');
</script>

<template>
    <AutoComplete v-model="value" aria-label="city" :data="['semi', 'design']" :motion="false" @change="emit('order', 'change')" @update:modelValue="emit('order', 'update:modelValue')" />
    <span data-testid="model">{{ value }}</span>
    <button type="button" @click="value = 'platform'">set</button>
</template>
