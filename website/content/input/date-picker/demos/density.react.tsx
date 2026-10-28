import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return (
        <div>
            <DatePicker type="dateTime" density="compact" />
            <br />
            <br />
            <DatePicker type="dateRange" density="compact" style={{ width: 260 }} />
        </div>
    );
}
