import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return (
        <div>
            <DatePicker type="date" insetInput />
            <br />
            <br />
            <DatePicker type="dateTime" insetInput />
            <br />
            <br />
            <DatePicker type="dateRange" insetInput style={{ width: 260 }} />
            <br />
            <br />
            <DatePicker type="dateTimeRange" insetInput style={{ width: 400 }} />
            <br />
            <br />
            <DatePicker type="month" placeholder="请选择年月" insetInput style={{ width: 140 }} />
            <br />
            <br />
            <DatePicker type="monthRange" placeholder="请选择年月范围" insetInput style={{ width: 200 }} />
            <br />
            <br />
            <DatePicker type="date" position="bottomLeft" insetInput />
            <br />
            <br />
            <DatePicker type="dateTime" format="yyyy-MM-dd HH:mm" insetInput />
        </div>
    );
}
