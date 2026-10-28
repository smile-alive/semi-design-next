<script setup lang="ts">
    import { Slider } from '@fibrae/semi-ui-vue';

    const boxStyle = {
        height: '300px',
        marginLeft: '30px',
        marginTop: '10px',
        paddingRight: '30px',
        display: 'inline-block',
    };
    const marks = { 20: '20°C', 40: '40°C' };
</script>

<template>
    <div>
        <div :style="boxStyle">
            <Slider aria-label="Vertical slider" vertical />
        </div>
        <div :style="boxStyle">
            <Slider aria-label="Reversed vertical slider" vertical verticalReverse />
        </div>
        <div :style="boxStyle">
            <Slider aria-label="Vertical range slider" :defaultValue="[20, 60]" range vertical />
        </div>
        <div :style="boxStyle">
            <Slider aria-label="Reversed vertical range slider" :defaultValue="[20, 60]" range vertical verticalReverse />
        </div>
        <div :style="boxStyle">
            <Slider aria-label="Vertical range slider with marks" :defaultValue="[20, 60]" :marks="marks" range :step="10" vertical />
        </div>
        <div :style="boxStyle">
            <Slider aria-label="Reversed vertical range slider with marks" :defaultValue="[20, 60]" :marks="marks" range :step="10" vertical verticalReverse />
        </div>
    </div>
</template>
