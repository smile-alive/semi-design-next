<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ height: '100px', display: 'flex' }">
        <Progress aria-label="disk usage" direction="vertical" :percent="10" />
        <Progress aria-label="disk usage" direction="vertical" :percent="25" />
        <Progress aria-label="disk usage" direction="vertical" :percent="50" />
        <Progress aria-label="disk usage" direction="vertical" :percent="80" size="large" />
        <Progress aria-label="disk usage" direction="vertical" :percent="80" :style="{ width: '8px' }" />
    </div>
</template>
