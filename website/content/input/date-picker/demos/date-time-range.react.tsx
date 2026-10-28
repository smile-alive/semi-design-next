import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return (
        <>
            <DatePicker type="dateTimeRange" style={{ width: 400, marginBottom: 8 }} onChange={console.log} />
            <DatePicker type="dateTimeRange" style={{ width: 400 }} defaultPickerValue={[new Date('2022-08-08 00:00'), new Date('2022-08-09 12:00')]} onChange={console.log} />
        </>
    );
}
