<script setup lang="ts">
    import { ColorPicker, type ColorValue } from '@fibrae/semi-ui-vue';

    function onChange(value: ColorValue) {
        console.log(value);
    }
</script>

<template>
    <ColorPicker alpha eyeDropper @change="onChange" />
</template>
