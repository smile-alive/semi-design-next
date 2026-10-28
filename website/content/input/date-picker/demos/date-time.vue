<script setup lang="ts">
    import { DatePicker, type DatePickerTimePickerOpts } from '@fibrae/semi-ui-vue';

    const timePickerOpts: DatePickerTimePickerOpts = { scrollItemProps: { mode: 'wheel', cycled: true } };
</script>

<template>
    <h4>默认日期与时间选择</h4>
    <DatePicker type="dateTime" />
    <br />
    <br />
    <h4>开启时间列表无限循环</h4>
    <DatePicker :timePickerOpts="timePickerOpts" type="dateTime" />
</template>
