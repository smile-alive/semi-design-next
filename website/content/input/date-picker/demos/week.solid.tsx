import * as dateFns from 'date-fns';
import { DatePicker } from '@fibrae/semi-ui-solid';

export default function DatePickerDemo() {
    const handleChange = (date: Date | Date[]) => {
        console.log('date changed', date);
    };

    return (
        <div>
            <h4>选择自然周</h4>
            <DatePicker style={{ width: '260px' }} type="dateRange" weekStartsOn={1} startDateOffset={(date) => dateFns.startOfWeek(date, { weekStartsOn: 1 })} endDateOffset={(date) => dateFns.endOfWeek(date, { weekStartsOn: 1 })} onChange={handleChange} />
            <br />
            <br />
            <h4>选择双周</h4>
            <DatePicker style={{ width: '260px' }} type="dateRange" weekStartsOn={1} startDateOffset={(date) => dateFns.startOfWeek(date, { weekStartsOn: 1 })} endDateOffset={(date) => dateFns.add(dateFns.endOfWeek(date, { weekStartsOn: 1 }), { days: 7 })} onChange={handleChange} />
            <br />
            <br />
            <h4>选择当前日和后6日</h4>
            <DatePicker style={{ width: '260px' }} type="dateRange" weekStartsOn={1} endDateOffset={(date) => dateFns.add(date, { days: 6 })} onChange={handleChange} />
            <br />
            <br />
        </div>
    );
}
