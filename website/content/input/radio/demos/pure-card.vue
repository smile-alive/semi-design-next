<script setup lang="ts">
    import { Radio, RadioGroup } from '@fibrae/semi-ui-vue';

    const extra = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
</script>

<template>
    <RadioGroup aria-label="单选组合示例" :defaultValue="2" direction="vertical" name="demo-radio-group-pureCard" type="pureCard">
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
