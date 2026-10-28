<script setup lang="ts">
    import type { CSSProperties } from 'vue';
    import { Calendar } from '@fibrae/semi-ui-vue';

    const importantDate: CSSProperties = {
        position: 'absolute',
        left: '0',
        right: '0',
        top: '0',
        bottom: '0',
        backgroundColor: 'var(--semi-color-danger-light-default)',
    };
    const displayValue = new Date(2019, 6, 23, 8, 32, 0);
    const importDates = [new Date(2019, 6, 2), new Date(2019, 6, 8), new Date(2019, 6, 19), new Date(2019, 6, 23)];
    const importDateStrings = importDates.map((date) => date.toString());
</script>

<template>
    <Calendar :displayValue="displayValue" :height="700" mode="month">
        <template #dateGrid="{ dateString }">
            <div v-if="importDateStrings.includes(dateString)" :style="importantDate" />
        </template>
    </Calendar>
</template>
