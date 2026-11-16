<script setup lang="ts">
    import Calendar from '../../calendar.vue';
    import type { EventObject } from '../../interface';

    const props = defineProps<{ active: boolean; displayValue: Date; events: EventObject[] }>();
    const emit = defineEmits<{ close: [event: MouseEvent | KeyboardEvent | null] }>();
</script>

<template>
    <KeepAlive>
        <Calendar v-if="props.active" :displayValue="props.displayValue" :events="props.events" mode="month" @close="emit('close', $event)" />
        <p v-else>other page</p>
    </KeepAlive>
</template>
