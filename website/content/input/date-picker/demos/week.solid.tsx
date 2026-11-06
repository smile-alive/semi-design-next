import * as dateFns from 'date-fns';
import { DatePicker } from '@fibrae/semi-ui-solid';

const startOfWeek = (date: Date) => dateFns.startOfWeek(date, { weekStartsOn: 1 });
const endOfWeek = (date: Date) => dateFns.endOfWeek(date, { weekStartsOn: 1 });
const endOfNextWeek = (date: Date) => dateFns.add(endOfWeek(date), { days: 7 });
const sixDaysLater = (date: Date) => dateFns.add(date, { days: 6 });

export default function DatePickerDemo() {
    const handleChange = (date: Date | Date[]) => {
        console.log('date changed', date);
    };

    return (
        <div>
            <h4>选择自然周</h4>
            <DatePicker style={{ width: '260px' }} type="dateRange" weekStartsOn={1} startDateOffset={startOfWeek} endDateOffset={endOfWeek} onChange={handleChange} />
            <br />
            <br />
            <h4>选择双周</h4>
            <DatePicker style={{ width: '260px' }} type="dateRange" weekStartsOn={1} startDateOffset={startOfWeek} endDateOffset={endOfNextWeek} onChange={handleChange} />
            <br />
            <br />
            <h4>选择当前日和后6日</h4>
            <DatePicker style={{ width: '260px' }} type="dateRange" weekStartsOn={1} endDateOffset={sixDaysLater} onChange={handleChange} />
            <br />
            <br />
        </div>
    );
}
