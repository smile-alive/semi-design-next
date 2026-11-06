<script setup lang="ts">
    import { DatePicker, Tooltip } from '@fibrae/semi-ui-vue';

    const dateStyle = {
        width: '100%',
        height: '100%',
        border: '1px solid var(--semi-color-primary)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };
</script>

<template>
    <DatePicker>
        <template #date="dateProps">
            <Tooltip v-if="dateProps.dayNumber === 1">
                <div :style="dateStyle">{{ dateProps.dayNumber }}</div>
                <template #content>Always Day 1</template>
            </Tooltip>
            <template v-else>{{ dateProps.dayNumber }}</template>
        </template>
    </DatePicker>
</template>
