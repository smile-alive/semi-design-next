<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';

    const defaultValue = new Date(2024, 4, 6, 10, 30, 0);
</script>

<template>
    <DatePicker :defaultValue="defaultValue" format="yyyy年MM月dd日 HH:mm" type="dateTime" />
</template>
