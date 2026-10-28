<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';

    const defaultValue = new Date(2024, 4, 6, 10, 30, 0);
</script>

<template>
    <DatePicker :defaultValue="defaultValue" :style="{ width: '140px' }" type="month" />
</template>
