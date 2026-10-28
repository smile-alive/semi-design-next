<script setup lang="ts">
    import { ref } from 'vue';
    import { ConfigProvider, DatePicker, Select, TimePicker } from '@fibrae/semi-ui-vue';

    const timeZone = ref('GMT+08:00');
    const defaultTimestamp = 1581599305265;
    const gmtList: string[] = [];
    for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
        const prefix = hourOffset >= 0 ? '+' : '-';
        gmtList.push(`GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`);
    }
    // fractional offsets stay fixed all year; an IANA name follows its daylight saving time
    gmtList.push('GMT-03:30', 'GMT+05:45', 'GMT+13:45', 'America/New_York');
</script>

<template>
    <ConfigProvider :timeZone="timeZone">
        <div :style="{ width: '300px' }">
            <h5 :style="{ margin: '10px' }">Select Time Zone:</h5>
            <Select aria-label="时区" :modelValue="timeZone" placeholder="请选择时区" showClear :style="{ width: '300px' }" @select="(value) => (timeZone = String(value))">
                <Select.Option v-for="gmt in gmtList" :key="gmt" :value="gmt">{{ gmt }}</Select.Option>
            </Select>
            <br />
            <br />
            <DatePicker :defaultValue="defaultTimestamp" type="dateTime" @change="(date, dateString) => console.log('DatePicker changed: ', date, dateString)" />
            <br />
            <br />
            <TimePicker :defaultValue="defaultTimestamp" @change="(date, dateString) => console.log('DatePicker changed: ', date, dateString)" />
        </div>
    </ConfigProvider>
</template>
