import { useMemo, useState } from 'react';
import { ConfigProvider, Select, DatePicker, TimePicker } from '@fibrae/semi-ui-react';

export default function ConfigProviderDemo() {
    const [timeZone, setTimeZone] = useState('GMT+08:00');
    const defaultTimestamp = 1581599305265;
    const gmtList = useMemo(() => {
        const list: string[] = [];
        for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
            const prefix = hourOffset >= 0 ? '+' : '-';
            const hOffset = Math.abs(hourOffset);
            list.push(`GMT${prefix}${String(hOffset).padStart(2, '0')}:00`);
        }
        // fractional offsets stay fixed all year; an IANA name follows its daylight saving time
        list.push('GMT-03:30', 'GMT+05:45', 'GMT+13:45', 'America/New_York');
        return list;
    }, []);

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
                <DatePicker type="dateTime" defaultValue={defaultTimestamp} onChange={(date, dateString) => console.log('DatePicker changed: ', date, dateString)} />
                <br />
                <br />
                <TimePicker defaultValue={defaultTimestamp} onChange={(date, dateString) => console.log('DatePicker changed: ', date, dateString)} />
            </div>
        </ConfigProvider>
    );
}
