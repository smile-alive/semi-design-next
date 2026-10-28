<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';

    const onPanelChange = (date: Date | Date[], dateString: string | string[]) => console.log(date, dateString);
</script>

<template>
    <DatePicker :style="{ width: '400px' }" syncSwitchMonth type="dateTimeRange" @panelChange="onPanelChange" />
</template>
