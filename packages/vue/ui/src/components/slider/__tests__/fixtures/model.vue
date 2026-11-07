<script setup lang="ts">
    import { ref } from 'vue';
    import Slider from '../..';

    const props = withDefaults(defineProps<{ initial?: number | number[]; range?: boolean }>(), {
        initial: 30,
        range: false,
    });
    const emit = defineEmits<{ change: [value: number | number[]]; afterChange: [value: number | number[]] }>();
    const value = ref<number | number[] | undefined>(props.initial);
</script>

<template>
    <Slider v-model="value" aria-label="volume" :range="props.range" style="width: 100%; height: 32px" @afterChange="emit('afterChange', $event)" @change="emit('change', $event)" />
    <output aria-label="value">{{ value }}</output>
    <button type="button" @click="value = undefined">reset</button>
</template>
