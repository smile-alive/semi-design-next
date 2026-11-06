<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <DatePicker :style="{ width: '400px' }" syncSwitchMonth type="dateTimeRange" @panelChange="(date, dateString) => console.log(date, dateString)" />
</template>
