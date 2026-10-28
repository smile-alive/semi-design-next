<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <DatePicker @change="(_date, dateString) => console.log(dateString)" />
</template>
