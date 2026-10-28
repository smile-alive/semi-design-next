<script setup lang="ts">
    import { ColorPicker, type ColorValue } from '@fibrae/semi-ui-vue';

    const defaultValue = ColorPicker.colorStringToValue('rgb(57,197,187)');

    function onChange(value: ColorValue) {
        console.log(value);
    }
</script>

<template>
    <div>
        <ColorPicker alpha :defaultValue="defaultValue" @change="onChange" />
    </div>
</template>
