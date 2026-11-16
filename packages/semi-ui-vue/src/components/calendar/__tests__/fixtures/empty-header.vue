<script setup lang="ts">
    import Calendar from '../../calendar.vue';
    import type { CalendarMode } from '../../interface';

    const props = defineProps<{ mode: CalendarMode; range: Date[]; show: boolean }>();
</script>

<template>
    <Calendar :mode="props.mode" :range="props.range">
        <template #header>
            <b v-if="props.show">custom header</b>
        </template>
    </Calendar>
</template>
