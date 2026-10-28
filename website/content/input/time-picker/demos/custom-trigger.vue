<script setup lang="ts">
    import { ref } from 'vue';
    import * as dateFns from 'date-fns';
    import { IconTimePicker } from '@fibrae/semi-icons-vue/lab';
    import { Tag, TimePicker } from '@fibrae/semi-ui-vue';

    const formatToken = 'HH:mm:ss';
    const time = ref<Date | (Date | undefined)[] | undefined>(new Date(2024, 0, 1, 10, 30, 0));
</script>

<template>
    <TimePicker v-model="time" :format="formatToken">
        <template #trigger="{ placeholder }">
            <Tag color="cyan" shape="circle" size="large" :style="{ padding: '12px', paddingRight: '16px', fontSize: '14px' }" type="light">
                <template #prefixIcon>
                    <IconTimePicker />
                </template>
                {{ time instanceof Date ? dateFns.format(time, formatToken) : placeholder }}
            </Tag>
        </template>
    </TimePicker>
</template>
