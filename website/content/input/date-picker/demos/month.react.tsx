import { DatePicker } from '@fibrae/semi-ui-react';

const defaultValue = new Date(2019, 6, 23, 12);

export default function DatePickerDemo() {
    return <DatePicker defaultValue={defaultValue} type="month" style={{ width: 140 }} />;
}
