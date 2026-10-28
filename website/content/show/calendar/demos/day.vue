<script setup lang="ts">
    import { Calendar } from '@fibrae/semi-ui-vue';

    // A fixed date keeps the server render and the browser on the same first frame
    const displayValue = new Date(2026, 9, 25);
</script>

<template>
    <Calendar :displayValue="displayValue" mode="day" />
</template>
