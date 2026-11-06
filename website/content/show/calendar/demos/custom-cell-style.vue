<script setup lang="ts">
    import type { CSSProperties } from 'vue';
    import { Calendar } from '@fibrae/semi-ui-vue';

    const importantDate: CSSProperties = {
        position: 'absolute',
        insetInline: '0',
        top: '0',
        bottom: '0',
        backgroundColor: 'var(--semi-color-danger-light-default)',
    };
    const displayValue = new Date(2019, 6, 23, 8, 32, 0);
    const importDates = [new Date(2019, 6, 2), new Date(2019, 6, 8), new Date(2019, 6, 19), new Date(2019, 6, 23)];
</script>

<template>
    <Calendar :displayValue="displayValue" :height="700" mode="month">
        <template #dateGrid="cell">
            <div v-if="importDates.some((date) => date.toString() === cell.dateString)" :style="importantDate" />
        </template>
    </Calendar>
</template>
