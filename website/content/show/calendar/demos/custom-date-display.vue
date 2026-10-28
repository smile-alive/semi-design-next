<script setup lang="ts">
    import { Avatar, Calendar } from '@fibrae/semi-ui-vue';

    const displayValue = new Date(2023, 4, 14);
    const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'lime'] as const;
</script>

<template>
    <Calendar :displayValue="displayValue" :height="400" mode="week">
        <template #dateDisplay="{ date }">
            <div :style="{ paddingBlock: '6px' }">
                <Avatar :color="colors[date.getDay()]" size="small">{{ date.getDate() }}</Avatar>
            </div>
        </template>
    </Calendar>
</template>
