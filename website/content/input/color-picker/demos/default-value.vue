<script setup lang="ts">
    import { ColorPicker } from '@fibrae/semi-ui-vue';

    const defaultValue = ColorPicker.colorStringToValue('rgb(57,197,187)');
</script>

<template>
    <div>
        <ColorPicker alpha :defaultValue="defaultValue" @change="(value) => console.log(value)" />
    </div>
</template>
