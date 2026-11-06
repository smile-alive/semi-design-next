<script setup lang="ts">
    import { Avatar, Calendar } from '@fibrae/semi-ui-vue';

    const displayValue = new Date(2023, 4, 14);
    const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'] as const;
</script>

<template>
    <Calendar :displayValue="displayValue" :height="400" mode="week">
        <template #dateDisplay="display">
            <div :style="{ paddingBlock: '6px' }">
                <Avatar :color="colors[display.date.getDay()]" size="small">{{ display.date.getDate() }}</Avatar>
            </div>
        </template>
    </Calendar>
</template>
