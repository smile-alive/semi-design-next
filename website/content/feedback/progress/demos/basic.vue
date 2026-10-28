<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '200px' }">
        <Progress aria-label="disk usage" :percent="10" stroke="var(--semi-color-warning)" />
        <br />
        <Progress aria-label="disk usage" :percent="25" stroke="var(--semi-color-danger)" />
        <br />
        <Progress aria-label="disk usage" :percent="50" />
        <br />
        <Progress aria-label="download progress" :percent="80" />
        <br />
        <Progress aria-label="disk usage" :percent="80" size="large" />
        <br />
        <Progress aria-label="disk usage" :percent="80" :style="{ height: '8px' }" />
    </div>
</template>
