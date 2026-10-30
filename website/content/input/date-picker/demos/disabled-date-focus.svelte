<script lang="ts">
    import * as dateFns from 'date-fns';
    import { DatePicker, type DatePickerDisabledDateType } from '@fibrae/semi-ui-svelte';

    const today = new Date();

    const disabledDate: DatePickerDisabledDateType = (date, options) => {
        if (!date) {
            return false;
        }
        const rangeInputFocus = options?.rangeInputFocus;
        const baseDate = dateFns.set(today, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        if (rangeInputFocus === 'rangeStart') {
            return dateFns.subDays(baseDate, 2) <= date && date <= dateFns.addDays(baseDate, 2);
        } else if (rangeInputFocus === 'rangeEnd') {
            return dateFns.subDays(baseDate, 3) <= date && date <= dateFns.addDays(baseDate, 3);
        }
        return false;
    };
</script>

<div>
    <h4>开始日期禁用今天前2日和后2日，结束日期禁用今天前3天和后3天</h4>
    <DatePicker defaultPickerValue={today} {disabledDate} motion={false} type="dateRange" />
</div>
