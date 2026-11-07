<script setup lang="ts">
    import Calendar from '../../calendar.vue';
    import type { CalendarMode } from '../../interface';

    defineProps<{ mode: CalendarMode; range: Date[]; show: boolean }>();
</script>

<template>
    <Calendar :mode="mode" :range="range">
        <template #header>
            <b v-if="show">custom header</b>
        </template>
    </Calendar>
</template>
