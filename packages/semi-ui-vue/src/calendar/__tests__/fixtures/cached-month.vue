<script setup lang="ts">
    import Calendar from '../../calendar.vue';
    import type { EventObject } from '../../interface';

    defineProps<{ active: boolean; displayValue: Date; events: EventObject[] }>();
    const emit = defineEmits<{ close: [event: MouseEvent | KeyboardEvent | null] }>();
</script>

<template>
    <KeepAlive>
        <Calendar v-if="active" :displayValue="displayValue" :events="events" mode="month" @close="emit('close', $event)" />
        <p v-else>other page</p>
    </KeepAlive>
</template>
