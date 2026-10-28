import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return <DatePicker onChange={(_date, dateString) => console.log(dateString)} />;
}
