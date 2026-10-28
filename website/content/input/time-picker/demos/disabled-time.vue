<script setup lang="ts">
    import { TimePicker } from '@fibrae/semi-ui-vue';

    const range = (length: number) => Array.from({ length }, (_, i) => i);

    // The right panel disables everything earlier than the start time picked on the left
    const disabledTime = (value: (Date | undefined)[], panelType: 'left' | 'right') => {
        const start = value[0];
        if (panelType === 'right' && start) {
            const h = start.getHours();
            const m = start.getMinutes();
            return {
                disabledHours: () => range(h),
                disabledMinutes: (hour: number) => (hour === h ? range(m) : []),
            };
        }
        return {};
    };
</script>

<template>
    <TimePicker :disabledTime="disabledTime" type="timeRange" />
</template>
