<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <DatePicker needConfirm type="dateTime" @cancel="(...args) => console.log('Canceled: ', ...args)" @change="(...args) => console.log('Changed: ', ...args)" @confirm="(...args) => console.log('Confirmed: ', ...args)" />
</template>
