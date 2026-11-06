import { DatePicker } from '@fibrae/semi-ui-react';

const defaultValue = new Date(2024, 4, 6, 10, 30, 0);

export default function DatePickerDemo() {
    return <DatePicker disabled type="dateTime" defaultValue={defaultValue} />;
}
