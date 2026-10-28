<script setup lang="ts">
    import { Calendar } from '@fibrae/semi-ui-vue';

    const range = [new Date(2020, 8, 26), new Date(2020, 8, 31)];
</script>

<template>
    <Calendar mode="range" :range="range" />
</template>
