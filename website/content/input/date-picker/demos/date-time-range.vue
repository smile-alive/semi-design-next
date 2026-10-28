<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';

    const defaultPickerValue = [new Date('2022-08-08 00:00'), new Date('2022-08-09 12:00')];
</script>

<template>
    <DatePicker :style="{ width: '400px', marginBottom: '8px' }" type="dateTimeRange" @change="console.log" />
    <DatePicker :defaultPickerValue="defaultPickerValue" :style="{ width: '400px' }" type="dateTimeRange" @change="console.log" />
</template>
