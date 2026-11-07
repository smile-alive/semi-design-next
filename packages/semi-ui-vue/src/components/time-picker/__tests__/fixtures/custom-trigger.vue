<script setup lang="ts">
    import { ref } from 'vue';
    import TimePicker from '../..';
    import Button from '../../../button';

    const time = ref<Date | (Date | undefined)[] | undefined>(new Date(2022, 3, 17, 10, 24, 18));
</script>

<template>
    <TimePicker v-model="time" format="HH:mm:ss" :scrollItemProps="{ cycled: false }">
        <template #trigger="{ placeholder }">
            <Button>{{ time ? 'time' : placeholder }}</Button>
        </template>
    </TimePicker>
    <Button>outside</Button>
</template>
