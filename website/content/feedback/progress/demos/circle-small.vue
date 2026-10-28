<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Progress aria-label="disk usage" :percent="10" size="small" :style="{ margin: '5px' }" type="circle" />
    <Progress aria-label="disk usage" :percent="25" size="small" :style="{ margin: '5px' }" type="circle" />
    <Progress aria-label="disk usage" :percent="50" size="small" :style="{ margin: '5px' }" type="circle" />
    <Progress aria-label="disk usage" :percent="80" size="small" :style="{ margin: '5px' }" type="circle" />
</template>
