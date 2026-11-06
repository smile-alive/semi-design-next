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
        <template #fullDate="fullDateProps">
            <div
                :class="{
                    [`${prefix}-day-inrange`]: fullDateProps.dayStatus.isInRange,
                    [`${prefix}-day-hover`]: fullDateProps.dayStatus.isHover,
                    [`${prefix}-day-selected`]: fullDateProps.dayStatus.isSelected,
                    [`${prefix}-day-selected-start`]: fullDateProps.dayStatus.isSelectedStart,
                    [`${prefix}-day-selected-end`]: fullDateProps.dayStatus.isSelectedEnd,
                }"
                :style="dayStyle"
            >
                {{ fullDateProps.dayNumber }}
            </div>
        </template>
    </DatePicker>
</template>
