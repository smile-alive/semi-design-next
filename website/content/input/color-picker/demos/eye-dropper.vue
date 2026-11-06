<script setup lang="ts">
    import { ColorPicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <ColorPicker alpha eyeDropper @change="(value) => console.log(value)" />
</template>
