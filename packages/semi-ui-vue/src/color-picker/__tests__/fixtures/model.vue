<script setup lang="ts">
    import { ref } from 'vue';
    import ColorPicker, { type ColorValue } from '../..';

    const value = ref<ColorValue>(ColorPicker.colorStringToValue('#ff0000'));
</script>

<template>
    <ColorPicker v-model="value" alpha />
    <output aria-label="hex">{{ value.hex }}</output>
</template>
