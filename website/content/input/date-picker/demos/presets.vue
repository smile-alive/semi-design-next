<script setup lang="ts">
    import { DatePicker, type DatePickerPresetsType } from '@fibrae/semi-ui-vue';

    const presets: DatePickerPresetsType = [
        {
            text: 'Today',
            start: () => new Date(),
            end: () => new Date(),
        },
        () => ({
            text: 'Tomorrow',
            start: new Date(new Date().valueOf() + 1000 * 3600 * 24),
            end: new Date(new Date().valueOf() + 1000 * 3600 * 24),
        }),
    ];
</script>

<template>
    <DatePicker presetPosition="left" :presets="presets" type="dateTime" />
</template>
