import { DatePicker } from '@fibrae/semi-ui-react';

const defaultValue = new Date(2019, 6, 23, 12);

export default function DatePickerDemo() {
    return <DatePicker format="yyyy年MM月dd日 HH:mm" type="dateTime" defaultValue={defaultValue} />;
}
