import * as dateFns from 'date-fns';
import { DatePicker } from '@fibrae/semi-ui-solid';

export default function DatePickerDemo() {
    return (
        <div>
            <h4>动态禁用日期：禁止选择之前的日期</h4>
            <DatePicker
                type="dateRange"
                disabledDate={(date, options) => {
                    if (!date || !options?.rangeStart) {
                        return false;
                    }
                    const startDate = dateFns.parseISO(options.rangeStart);
                    return dateFns.isBefore(date, startDate);
                }}
                style={{ width: '260px' }}
            />
        </div>
    );
}
