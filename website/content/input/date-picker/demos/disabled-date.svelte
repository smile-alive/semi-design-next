<script lang="ts">
    import * as dateFns from 'date-fns';
    import { range } from 'es-toolkit';
    import { DatePicker, type DatePickerDisabledDateType, type DatePickerDisabledTimeType } from '@fibrae/semi-ui-svelte';

    const nextValidMonth = dateFns.addMonths(Date.now(), 1);

    const disabledTime: DatePickerDisabledTimeType = (date) =>
        // With type dateTime, date is a single Date
        dateFns.isToday(date as Date)
            ? {
                  disabledHours: () => [17, 18],
                  disabledMinutes: (hour) => (19 === hour ? range(0, 10, 1) : []),
                  disabledSeconds: (hour, minute) => (hour === 20 && minute === 20 ? range(0, 20, 1) : []),
              }
            : {};

    const disabledTime2: DatePickerDisabledTimeType = (_date, panelType) => (panelType === 'left' ? { disabledHours: () => [17, 18] } : { disabledHours: () => [12, 13, 14, 15, 16, 17, 18] });

    const disabledDate: DatePickerDisabledDateType = (date) => {
        const deadDate = dateFns.setDate(dateFns.addMonths(Date.now(), 1), 28);
        return !!date && date.getTime() < deadDate.getTime();
    };
</script>

<div>
    <div>
        <h4>禁用时间：禁用今天下午5-6点</h4>
        <DatePicker {disabledTime} hideDisabledOptions={false} type="dateTime" />
    </div>
    <div>
        <h4>禁用时间：两个面板禁用不同时间</h4>
        <DatePicker disabledTime={disabledTime2} hideDisabledOptions={false} style="width: 400px" type="dateTimeRange" />
    </div>
    <div>
        <h4>禁用日期：禁用下个月28号之前的所有日期</h4>
        <DatePicker defaultPickerValue={nextValidMonth} {disabledDate} style="width: 400px" type="dateTimeRange" />
    </div>
</div>
