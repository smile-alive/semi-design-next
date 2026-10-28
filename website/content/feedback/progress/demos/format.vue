<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Progress aria-label="disk usage" :percent="75" showInfo :style="{ margin: '10px' }" type="circle">
        <template #format="{ percent }">{{ percent }}Days</template>
    </Progress>
    <Progress aria-label="disk usage" :percent="100" showInfo :style="{ margin: '10px' }" type="circle">
        <template #format>Done</template>
    </Progress>
    <Progress aria-label="disk usage" :percent="50" :showInfo="false" :style="{ margin: '10px' }" type="circle" />
</template>
