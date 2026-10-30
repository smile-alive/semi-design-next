<script lang="ts">
    import { ConfigProvider, Select, TimePicker } from '@fibrae/semi-ui-svelte';

    let timeZone = $state('GMT+08:00');
    const defaultTimestamp = 1581599305265;
    const gmtList: string[] = [];
    for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
        const prefix = hourOffset >= 0 ? '+' : '-';
        gmtList.push(`GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`);
    }
    const optionList = gmtList.map((gmt) => ({ value: gmt, label: gmt }));

    const onChange = (date: unknown, dateString: string | string[]) => console.log('DatePicker changed: ', date, dateString);
</script>

<ConfigProvider {timeZone}>
    <div style="width: 300px">
        <h5 style="margin: 10px">Select Time Zone:</h5>
        <Select aria-label="时区" onSelect={(value) => (timeZone = String(value))} {optionList} placeholder="请选择时区" showClear style="width: 300px" value={timeZone} />
        <br />
        <br />
        <h5 style="margin: 10px">TimePicker:</h5>
        <TimePicker {onChange} value={defaultTimestamp} />
    </div>
</ConfigProvider>
