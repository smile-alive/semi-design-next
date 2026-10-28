import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return <DatePicker type="dateRange" style={{ width: 260 }} onChange={console.log} />;
}
