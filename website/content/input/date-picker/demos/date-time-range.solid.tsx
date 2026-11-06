import { DatePicker } from '@fibrae/semi-ui-solid';

const defaultPickerValue = [new Date('2022-08-08 00:00'), new Date('2022-08-09 12:00')];

export default function DatePickerDemo() {
    return (
        <>
            <DatePicker type="dateTimeRange" style={{ width: '400px', 'margin-block-end': '8px' }} onChange={console.log} />
            <DatePicker type="dateTimeRange" style={{ width: '400px' }} defaultPickerValue={defaultPickerValue} onChange={console.log} />
        </>
    );
}
