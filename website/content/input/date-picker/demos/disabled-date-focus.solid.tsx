import * as dateFns from 'date-fns';
import { DatePicker, type DatePickerDisabledDateType } from '@fibrae/semi-ui-solid';

const today = new Date();

const disabledDate: DatePickerDisabledDateType = (date, options) => {
    if (!date) {
        return false;
    }
    const rangeInputFocus = options?.rangeInputFocus;
    const baseDate = dateFns.set(today, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    if (rangeInputFocus === 'rangeStart') {
        const disabledStart = dateFns.subDays(baseDate, 2);
        const disabledEnd = dateFns.addDays(baseDate, 2);
        return disabledStart <= date && date <= disabledEnd;
    } else if (rangeInputFocus === 'rangeEnd') {
        const disabledStart = dateFns.subDays(baseDate, 3);
        const disabledEnd = dateFns.addDays(baseDate, 3);
        return disabledStart <= date && date <= disabledEnd;
    } else {
        return false;
    }
};

export default function DatePickerDemo() {
    return (
        <div>
            <h4>开始日期禁用今天前2日和后2日，结束日期禁用今天前3天和后3天</h4>
            <DatePicker motion={false} type="dateRange" disabledDate={disabledDate} defaultPickerValue={today} />
        </div>
    );
}
