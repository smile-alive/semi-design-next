<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div :style="{ width: '200px' }">
        <Progress aria-label="disk usage" :percent="10" showInfo stroke="var(--semi-color-warning)" />
        <br />
        <Progress aria-label="disk usage" :percent="25" showInfo stroke="var(--semi-color-danger)" />
        <br />
        <Progress aria-label="disk usage" :percent="50" showInfo />
        <br />
        <Progress aria-label="disk usage" :percent="50" showInfo>
            <template #format="{ percent }">{{ percent * 10 }}‰</template>
        </Progress>
    </div>
</template>
