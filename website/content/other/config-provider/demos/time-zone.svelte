<script lang="ts">
    import { ConfigProvider, DatePicker, Select, TimePicker } from '@fibrae/semi-ui-svelte';

    let timeZone = $state('GMT+08:00');
    const defaultTimestamp = 1581599305265;
    const gmtList: string[] = [];
    for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
        const prefix = hourOffset >= 0 ? '+' : '-';
        gmtList.push(`GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`);
    }
    // fractional offsets stay fixed all year; an IANA name follows its daylight saving time
    gmtList.push('GMT-03:30', 'GMT+05:45', 'GMT+13:45', 'America/New_York');
    const optionList = gmtList.map((gmt) => ({ value: gmt, label: gmt }));

    const onChange = (date: unknown, dateString: string | string[]) => console.log('changed: ', date, dateString);
</script>

<ConfigProvider {timeZone}>
    <div style="width: 300px">
        <h5 style="margin: 10px">Select Time Zone:</h5>
        <Select aria-label="时区" onSelect={(value) => (timeZone = String(value))} {optionList} placeholder="请选择时区" showClear style="width: 300px" value={timeZone} />
        <br />
        <br />
        <DatePicker {onChange} type="dateTime" value={defaultTimestamp} />
        <br />
        <br />
        <TimePicker {onChange} value={defaultTimestamp} />
    </div>
</ConfigProvider>
