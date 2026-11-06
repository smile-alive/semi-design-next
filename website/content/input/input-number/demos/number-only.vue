<script setup lang="ts">
    import { InputNumber } from '@fibrae/semi-ui-vue';
</script>

<template>
    <InputNumber aria-label="Integer" :formatter="(value) => `${value}`.replace(/\D/g, '')" :max="Number.MAX_SAFE_INTEGER" :min="0" @numberChange="(number) => console.log(number)" />
</template>
