<script setup lang="ts">
    import { Slider } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <div>
            <div id="slider-handle-dot-default">Default</div>
            <Slider aria-labelledby="slider-handle-dot-default" :handleDot="{ size: '4px', color: 'blue' }" showBoundary />
        </div>
        <br />
        <br />
        <div>
            <div id="slider-handle-dot-range">Range</div>
            <Slider
                aria-labelledby="slider-handle-dot-range"
                :defaultValue="[20, 60]"
                :handleDot="[
                    { size: '4px', color: 'blue' },
                    { size: '4px', color: 'pink' },
                ]"
                range
            />
        </div>
    </div>
</template>
