import { For, createSignal } from 'solid-js';
import { ConfigProvider, Select, DatePicker, TimePicker } from '@fibrae/semi-ui-solid';

const defaultTimestamp = 1581599305265;

// Fractional offsets are written as fixed GMT strings; an IANA name is kept because it follows daylight saving time
const gmtList = [
    ...Array.from({ length: 26 }, (_, index) => {
        const hourOffset = index - 11;
        const prefix = hourOffset >= 0 ? '+' : '-';
        return `GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`;
    }),
    'GMT-03:30',
    'GMT+05:45',
    'GMT+13:45',
    'America/New_York',
];

export default function ConfigProviderDemo() {
    const [timeZone, setTimeZone] = createSignal('GMT+08:00');

    return (
        <ConfigProvider timeZone={timeZone()}>
            <div style={{ width: '300px' }}>
                <h5 style={{ margin: '10px' }}>Select Time Zone:</h5>
                <Select aria-label="时区" placeholder="请选择时区" style={{ width: '300px' }} value={timeZone()} showClear onSelect={(value) => setTimeZone(String(value))}>
                    <For each={gmtList}>{(gmt) => <Select.Option value={gmt}>{gmt}</Select.Option>}</For>
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
