<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Slider } from '@fibrae/semi-ui-vue';

    const range = [10, 100];

    const getRailStyle = (value: number[]) => {
        // transparent lets the middle segment show the track color
        const color = ['var(--semi-color-danger)', 'transparent', 'var(--semi-color-success)'];
        const gradientPos = value.map((val) => Number(((val - range[0]) / (range[1] - range[0])).toFixed(2)) * 100);
        return {
            background: `linear-gradient(to right, ${color[0]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[0]}%, ${color[1]} ${gradientPos[1]}%, ${color[2]} ${gradientPos[1]}%)`,
        };
    };

    const value = ref([20, 60]);

    const changeValue = (newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
            value.value = newValue;
        }
    };

    const railStyle = computed(() => getRailStyle(value.value));
</script>

<template>
    <Slider aria-label="Value range" :max="range[1]" :min="range[0]" :modelValue="value" :railStyle="railStyle" range @change="changeValue" />
</template>
