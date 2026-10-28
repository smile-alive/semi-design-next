import { DatePicker } from '@fibrae/semi-ui-solid';

export default function DatePickerDemo() {
    return <DatePicker syncSwitchMonth type="dateTimeRange" style={{ width: '400px' }} onPanelChange={(date, dateString) => console.log(date, dateString)} />;
}
