<script setup lang="ts">
    import { Radio, RadioGroup } from '@fibrae/semi-ui-vue';

    const extra = 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用';
</script>

<template>
    <RadioGroup aria-label="单选组合示例" :defaultValue="2" direction="vertical" name="demo-radio-group-card" type="card">
        <Radio disabled :style="{ width: '280px' }" :value="1">
            单选框标题
            <template #extra>{{ extra }}</template>
        </Radio>
        <Radio :style="{ width: '280px' }" :value="2">
            单选框标题
            <template #extra>{{ extra }}</template>
        </Radio>
        <Radio :style="{ width: '280px' }" :value="3">
            单选框标题
            <template #extra>{{ extra }}</template>
        </Radio>
    </RadioGroup>
</template>
