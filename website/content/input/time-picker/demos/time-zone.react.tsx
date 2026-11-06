import { useState } from 'react';
import { ConfigProvider, Select, TimePicker } from '@fibrae/semi-ui-react';

const defaultTimestamp = 1581599305265;
const gmtList: string[] = [];
for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
    const prefix = hourOffset >= 0 ? '+' : '-';
    gmtList.push(`GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`);
}

export default function TimePickerDemo() {
    const [timeZone, setTimeZone] = useState('GMT+08:00');

    return (
        <ConfigProvider timeZone={timeZone}>
            <div style={{ width: 300 }}>
                <h5 style={{ margin: 10 }}>Select Time Zone:</h5>
                <Select aria-label="时区" placeholder="请选择时区" style={{ width: 300 }} value={timeZone} showClear onSelect={(value) => setTimeZone(String(value))}>
                    {gmtList.map((gmt) => (
                        <Select.Option key={gmt} value={gmt}>
                            {gmt}
                        </Select.Option>
                    ))}
                </Select>
                <br />
                <br />
                <h5 style={{ margin: 10 }}>TimePicker:</h5>
                <TimePicker defaultValue={defaultTimestamp} onChange={(date, dateString) => console.log('DatePicker changed: ', date, dateString)} />
            </div>
        </ConfigProvider>
    );
}
