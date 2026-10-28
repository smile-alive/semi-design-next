<script setup lang="ts">
    import * as dateFns from 'date-fns';
    import { DatePicker, type DatePickerDisabledDateType } from '@fibrae/semi-ui-vue';

    const disabledDate: DatePickerDisabledDateType = (date, options) => {
        if (!date || !options?.rangeStart) {
            return false;
        }
        return dateFns.isBefore(date, dateFns.parseISO(options.rangeStart));
    };
</script>

<template>
    <div>
        <h4>动态禁用日期：禁止选择之前的日期</h4>
        <DatePicker :disabledDate="disabledDate" :style="{ width: '260px' }" type="dateRange" />
    </div>
</template>
