import { DatePicker } from '@fibrae/semi-ui-solid';

const defaultValue = new Date(2024, 4, 6, 12);

export default function DatePickerDemo() {
    return <DatePicker format="yyyy年MM月dd日 HH:mm" type="dateTime" defaultValue={defaultValue} />;
}
