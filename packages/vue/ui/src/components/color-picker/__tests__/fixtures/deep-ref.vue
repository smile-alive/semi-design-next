<script setup lang="ts">
    import { ref } from 'vue';
    import ColorPicker, { type ColorValue } from '../..';

    const value = ref<ColorValue>(ColorPicker.colorStringToValue('#ff0000'));
    const replace = () => {
        value.value = ColorPicker.colorStringToValue('#00ff00');
    };
</script>

<template>
    <ColorPicker v-model="value" />
    <button type="button" @click="replace">replace</button>
</template>
