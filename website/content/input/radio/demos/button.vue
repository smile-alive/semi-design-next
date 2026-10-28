<script setup lang="ts">
    import { Radio, RadioGroup, Space } from '@fibrae/semi-ui-vue';

    const sizes = ['small', 'middle', 'large'] as const;
</script>

<template>
    <Space align="start" spacing="loose" vertical>
        <RadioGroup v-for="size in sizes" :key="size" aria-label="单选组合示例" :buttonSize="size" :defaultValue="1" :name="`demo-radio-${size}`" type="button">
            <Radio :value="1">即时推送</Radio>
            <Radio :value="2">定时推送</Radio>
            <Radio :value="3">动态推送</Radio>
        </RadioGroup>
    </Space>
</template>
