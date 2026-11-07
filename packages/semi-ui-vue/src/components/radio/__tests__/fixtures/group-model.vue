<script setup lang="ts">
    import { ref } from 'vue';
    import { RadioGroup } from '../..';
    import type { RadioChangeEvent, RadioValue } from '../../interface';

    const emit = defineEmits<{ change: [event: RadioChangeEvent] }>();
    const value = ref<RadioValue | undefined>(1);
    const options = [
        { label: 'semi', value: 1 },
        { label: 'design', value: 2 },
        { label: 'dsm', value: 3 },
    ];
</script>

<template>
    <RadioGroup v-model="value" name="demo" :options="options" type="button" @change="emit('change', $event)" />
    <button type="button" @click="value = 3">pick 3</button>
    <button type="button" @click="value = undefined">reset</button>
    <output aria-label="model">{{ String(value) }}</output>
</template>
