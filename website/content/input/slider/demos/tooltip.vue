<script setup lang="ts">
    import { Slider } from '@fibrae/semi-ui-vue';

    const formatPercent = (value: number) => `${value}%`;
</script>

<template>
    <div>
        <Slider aria-label="带提示的滑块" :getAriaValueText="formatPercent" :tipFormatter="formatPercent" />
        <br />
        <br />
        <Slider aria-label="不带提示的滑块" :tipFormatter="null" />
    </div>
</template>
