<script setup lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-vue';

    const extra = 'Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统';
    const items = [
        { value: '1', disabled: true },
        { value: '2', disabled: true },
        { value: '3', disabled: false },
        { value: '4', disabled: false },
    ];
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" :defaultValue="['1', '3']" direction="vertical" type="card">
        <Checkbox v-for="item in items" :key="item.value" :disabled="item.disabled" :style="{ width: '280px' }" :value="item.value">
            单选框标题
            <template #extra>{{ extra }}</template>
        </Checkbox>
    </CheckboxGroup>
</template>
