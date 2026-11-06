<script lang="ts">
    import * as dateFns from 'date-fns';
    import { DatePicker, type DatePickerDisabledDateType } from '@fibrae/semi-ui-svelte';

    const disabledDate: DatePickerDisabledDateType = (date, options) => {
        if (!date || !options?.rangeStart) {
            return false;
        }
        const startDate = dateFns.parseISO(options.rangeStart);
        return dateFns.isBefore(date, startDate);
    };
</script>

<div>
    <h4>动态禁用日期：禁止选择之前的日期</h4>
    <DatePicker {disabledDate} style="width: 260px" type="dateRange" />
</div>
