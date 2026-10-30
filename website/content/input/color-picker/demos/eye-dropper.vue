<script setup lang="ts">
    import { ColorPicker, type ColorValue } from '@fibrae/semi-ui-vue';

    const onChange = (value: ColorValue) => {
        console.log(value);
    };
</script>

<template>
    <ColorPicker alpha eyeDropper @change="onChange" />
</template>
