<script setup lang="ts">
    import { ref } from 'vue';
    import { ConfigProvider, Select, TimePicker } from '@fibrae/semi-ui-vue';

    const timeZone = ref('GMT+08:00');
    const defaultTimestamp = 1581599305265;
    const gmtList: string[] = [];
    for (let hourOffset = -11; hourOffset <= 14; hourOffset++) {
        const prefix = hourOffset >= 0 ? '+' : '-';
        gmtList.push(`GMT${prefix}${String(Math.abs(hourOffset)).padStart(2, '0')}:00`);
    }

    const onChange = (date: unknown, dateString: string | string[]) => console.log('DatePicker changed: ', date, dateString);
</script>

<template>
    <ConfigProvider :timeZone="timeZone">
        <div :style="{ width: '300px' }">
            <h5 :style="{ margin: '10px' }">Select Time Zone:</h5>
            <Select aria-label="时区" :modelValue="timeZone" placeholder="请选择时区" showClear :style="{ width: '300px' }" @select="timeZone = String($event)">
                <Select.Option v-for="gmt in gmtList" :key="gmt" :value="gmt">{{ gmt }}</Select.Option>
            </Select>
            <br />
            <br />
            <h5 :style="{ margin: '10px' }">TimePicker:</h5>
            <TimePicker :defaultValue="defaultTimestamp" @change="onChange" />
        </div>
    </ConfigProvider>
</template>
