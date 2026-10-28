import { useCallback } from 'react';
import * as dateFns from 'date-fns';
import { range } from 'es-toolkit';
import { DatePicker, type DatePickerDisabledDateType, type DatePickerDisabledTimeType } from '@fibrae/semi-ui-react';

const nextValidMonth = new Date();
nextValidMonth.setMonth((nextValidMonth.getMonth() + 1) % 12);

export default function DatePickerDemo() {
    const disabledTime = useCallback<DatePickerDisabledTimeType>(
        (date) =>
            // With type dateTime, date is a single Date
            dateFns.isToday(date as Date)
                ? {
                      disabledHours: () => [17, 18],
                      disabledMinutes: (hour) => (19 === hour ? range(0, 10, 1) : []),
                      disabledSeconds: (hour, minute) => (hour === 20 && minute === 20 ? range(0, 20, 1) : []),
                  }
                : {},
        []
    );

    const disabledTime2 = useCallback<DatePickerDisabledTimeType>((_date, panelType) => {
        if (panelType === 'left') {
            return { disabledHours: () => [17, 18] };
        }
        return { disabledHours: () => [12, 13, 14, 15, 16, 17, 18] };
    }, []);

    const disabledDate = useCallback<DatePickerDisabledDateType>((date) => {
        const deadDate = new Date();
        const month = deadDate.getMonth();
        deadDate.setDate(28);
        deadDate.setMonth((month + 1) % 12);
        return !!date && date.getTime() < deadDate.getTime();
    }, []);

    return (
        <div>
            <div>
                <h4>禁用时间：禁用今天下午5-6点</h4>
                <DatePicker type="dateTime" hideDisabledOptions={false} disabledTime={disabledTime} />
            </div>
            <div>
                <h4>禁用时间：两个面板禁用不同时间</h4>
                <DatePicker type="dateTimeRange" hideDisabledOptions={false} disabledTime={disabledTime2} style={{ width: 400 }} />
            </div>
            <div>
                <h4>禁用日期：禁用下个月28号之前的所有日期</h4>
                <DatePicker type="dateTimeRange" disabledDate={disabledDate} defaultPickerValue={nextValidMonth} style={{ width: 400 }} />
            </div>
        </div>
    );
}
