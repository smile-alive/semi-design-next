<script setup lang="ts">
    import { Checkbox } from '@fibrae/semi-ui-vue';

    const extra = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
</script>

<template>
    <Checkbox aria-label="Checkbox 示例">
        Semi Design
        <template #extra>{{ extra }}</template>
    </Checkbox>
    <br />
    <Checkbox aria-label="Checkbox 示例" :style="{ width: '280px' }">
        Semi Design
        <template #extra>{{ extra }}</template>
    </Checkbox>
</template>
