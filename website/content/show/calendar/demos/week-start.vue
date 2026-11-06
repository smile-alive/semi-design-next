<script setup lang="ts">
    import { ref } from 'vue';
    import { Calendar, Radio, RadioGroup, type CalendarWeekStartsOn, type RadioValue } from '@fibrae/semi-ui-vue';

    const weekStartsOn = ref<RadioValue | undefined>(0);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    // A fixed date keeps the server render and the browser on the same first frame
    const displayValue = new Date(2019, 6, 23);
</script>

<template>
    <div>
        <RadioGroup v-model="weekStartsOn" aria-label="周起始日" name="demo-radio-group-vertical" type="button">
            <Radio v-for="(day, index) in days" :key="day" :value="index">{{ day }}</Radio>
        </RadioGroup>
        <Calendar :displayValue="displayValue" mode="month" :style="{ marginBlockStart: '20px' }" :weekStartsOn="weekStartsOn as CalendarWeekStartsOn" />
    </div>
</template>
