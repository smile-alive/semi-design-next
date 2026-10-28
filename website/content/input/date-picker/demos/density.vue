<script setup lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <DatePicker density="compact" type="dateTime" />
        <br />
        <br />
        <DatePicker density="compact" :style="{ width: '260px' }" type="dateRange" />
    </div>
</template>
