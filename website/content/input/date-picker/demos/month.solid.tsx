import { DatePicker } from '@fibrae/semi-ui-solid';

const defaultValue = new Date(2024, 4, 6, 10, 30, 0);

export default function DatePickerDemo() {
    return <DatePicker defaultValue={defaultValue} type="month" style={{ width: '140px' }} />;
}
