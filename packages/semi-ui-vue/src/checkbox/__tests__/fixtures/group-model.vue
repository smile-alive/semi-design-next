<script setup lang="ts">
    import { ref } from 'vue';
    import { CheckboxGroup } from '../..';
    import type { CheckboxValue } from '../../interface';

    const emit = defineEmits<{ change: [value: CheckboxValue[]] }>();
    const value = ref<CheckboxValue[] | undefined>(['a']);
</script>

<template>
    <CheckboxGroup v-model="value" :options="['a', 'b', 'c']" @change="emit('change', $event)" />
    <button type="button" @click="value = ['c']">pick c</button>
    <button type="button" @click="value = undefined">reset</button>
    <output aria-label="model">{{ JSON.stringify(value) }}</output>
</template>
