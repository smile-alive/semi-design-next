<script setup lang="ts">
    import { DatePicker, type DatePickerEmits } from '@fibrae/semi-ui-vue';

    const onConfirm = (...args: DatePickerEmits['confirm']) => {
        console.log('Confirmed: ', ...args);
    };
    const onCancel = (...args: DatePickerEmits['cancel']) => {
        console.log('Canceled: ', ...args);
    };
    const onChange = (...args: DatePickerEmits['change']) => {
        console.log('Changed: ', ...args);
    };
</script>

<template>
    <DatePicker needConfirm type="dateTime" @cancel="onCancel" @change="onChange" @confirm="onConfirm" />
</template>
