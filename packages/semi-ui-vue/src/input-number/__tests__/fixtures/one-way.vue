<script setup lang="ts">
    import InputNumber, { type InputNumberChangeEvent } from '../..';

    const props = defineProps<{ onChange?: (value: number | string, event: InputNumberChangeEvent) => void }>();
</script>

<template>
    <InputNumber :modelValue="5" @change="(next, event) => props.onChange?.(next, event)" />
</template>
