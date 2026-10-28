<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';

    const prefix = 'components-datepicker-demo';
    const dayStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        height: '80%',
        borderRadius: 'var(--semi-border-radius-circle)',
    };
</script>

<template>
    <DatePicker :style="{ width: '260px' }" type="dateRange">
        <template #fullDate="{ dayNumber, dayStatus }">
            <div
                :class="{
                    [`${prefix}-day-inrange`]: dayStatus.isInRange,
                    [`${prefix}-day-hover`]: dayStatus.isHover,
                    [`${prefix}-day-selected`]: dayStatus.isSelected,
                    [`${prefix}-day-selected-start`]: dayStatus.isSelectedStart,
                    [`${prefix}-day-selected-end`]: dayStatus.isSelectedEnd,
                }"
                :style="dayStyle"
            >
                {{ dayNumber }}
            </div>
        </template>
    </DatePicker>
</template>
