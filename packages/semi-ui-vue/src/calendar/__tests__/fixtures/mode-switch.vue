<script setup lang="ts">
    import { ref } from 'vue';
    import Radio, { RadioGroup } from '../../../radio';
    import Calendar from '../../calendar.vue';
    import type { CalendarMode, EventObject } from '../../interface';

    defineProps<{ displayValue: Date; events: EventObject[] }>();
    const mode = ref<CalendarMode>('week');
    const clickDate = ref<string | number>('?');
    const rangeDates = [new Date(2019, 6, 23), new Date(2019, 6, 26)];
</script>

<template>
    <RadioGroup :modelValue="mode" @update:modelValue="mode = $event as CalendarMode">
        <Radio value="day">日视图</Radio>
        <Radio value="week">周视图</Radio>
        <Radio value="month">月视图</Radio>
        <Radio value="range">多日视图</Radio>
    </RadioGroup>
    <Calendar :displayValue="displayValue" :events="events" :height="400" :mode="mode" :range="mode === 'range' ? rangeDates : undefined" @click="(_event, date) => (clickDate = date.getDate())">
        <template #event="{ event }">
            <div style="height: 100%; overflow: hidden">{{ event.children }}</div>
        </template>
    </Calendar>
    <div>当前点击的日期是{{ clickDate }}号</div>
</template>
