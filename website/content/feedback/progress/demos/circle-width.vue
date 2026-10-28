<script setup lang="ts">
    import { Progress } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Progress aria-label="disk usage" :percent="100" :style="{ margin: '5px' }" type="circle" :width="100" />
    </div>
    <div>
        <Progress aria-label="disk usage" :percent="100" stroke="var(--semi-color-danger)" :style="{ margin: '5px' }" type="circle" :width="100" />
    </div>
</template>
