import { DatePicker } from '@fibrae/semi-ui-solid';

export default function DatePickerDemo() {
    return <DatePicker onChange={(_date, dateString) => console.log(dateString)} />;
}
