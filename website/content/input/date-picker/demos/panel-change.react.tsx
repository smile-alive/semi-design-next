import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return <DatePicker syncSwitchMonth type="dateTimeRange" style={{ width: 400 }} onPanelChange={(date, dateString) => console.log(date, dateString)} />;
}
