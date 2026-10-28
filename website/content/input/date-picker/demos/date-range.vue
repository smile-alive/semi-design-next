<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <DatePicker :style="{ width: '260px' }" type="dateRange" @change="console.log" />
</template>
