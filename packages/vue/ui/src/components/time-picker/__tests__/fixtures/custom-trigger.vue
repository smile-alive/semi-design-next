<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import TimePicker from '../..';

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
