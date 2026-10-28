import { createSignal, For } from 'solid-js';
import { ConfigProvider, Select, TimePicker } from '@fibrae/semi-ui-solid';

const defaultTimestamp = 1581599305265;

const gmtList = Array.from({ length: 26 }, (_, i) => {
    const hourOffset = i - 11;
    const prefix = hourOffset >= 0 ? '+' : '-';
    return `GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`;
});

export default function TimePickerDemo() {
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
                <h5 style={{ margin: '10px' }}>TimePicker:</h5>
                <TimePicker defaultValue={defaultTimestamp} onChange={(date: Date, dateString: string) => console.log('DatePicker changed: ', date, dateString)} />
            </div>
        </ConfigProvider>
    );
}
