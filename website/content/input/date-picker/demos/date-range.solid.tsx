import { DatePicker } from '@fibrae/semi-ui-solid';

export default function DatePickerDemo() {
    return <DatePicker type="dateRange" style={{ width: '260px' }} onChange={console.log} />;
}
