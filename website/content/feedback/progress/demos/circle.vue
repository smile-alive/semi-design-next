<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Progress aria-label="disk usage" :percent="10" :style="{ margin: '5px' }" type="circle" />
        <Progress aria-label="disk usage" :percent="25" :style="{ margin: '5px' }" type="circle" />
        <Progress aria-label="disk usage" :percent="50" :style="{ margin: '5px' }" type="circle" />
        <Progress aria-label="disk usage" :percent="80" :style="{ margin: '5px' }" type="circle" />
    </div>
</template>
