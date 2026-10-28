<script setup lang="ts">
    import { ref } from 'vue';
    import TimePicker from '../..';
    import Button from '../../../button';
    import ConfigProvider from '../../../config-provider';

    const date = ref<Date | (Date | undefined)[] | undefined>(new Date('2022-04-17T00:00:00Z'));
    const disabledHours = () => [5];
</script>

<template>
    <ConfigProvider :timeZone="10">
        <TimePicker v-model="date" :disabledHours="disabledHours" format="HH:mm" :scrollItemProps="{ cycled: false }" />
    </ConfigProvider>
    <Button>outside</Button>
</template>
