<script setup lang="ts">
    import Slider from '../..';

    withDefaults(defineProps<{ tooltipOnMark?: boolean }>(), { tooltipOnMark: false });
    const marks = { 20: '20c', 40: '40c' };
    const percent = (value: number) => `${value}%`;
</script>

<template>
    <Slider :defaultValue="[30, 60]" :marks="marks" range style="width: 100px; height: 32px" :tipFormatter="percent" :tooltipOnMark="tooltipOnMark" tooltipVisible>
        <template #mark="{ value, label }">
            <strong class="custom-mark">{{ label }}@{{ value }}</strong>
        </template>
        <template #tip="{ value, handle }">
            <em class="custom-tip">{{ handle }}:{{ value }}</em>
        </template>
    </Slider>
</template>
