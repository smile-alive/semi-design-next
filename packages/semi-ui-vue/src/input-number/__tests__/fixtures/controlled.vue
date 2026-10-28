<script setup lang="ts">
    import { ref } from 'vue';
    import InputNumber, { type InputNumberChangeEvent } from '../..';

    const props = defineProps<{
        initValue: number | string;
        onChange?: (value: number | string, event: InputNumberChangeEvent) => void;
    }>();
    const value = ref<number | string>(props.initValue);
</script>

<template>
    <InputNumber v-model="value" @change="(next, event) => props.onChange?.(next, event)" />
</template>
