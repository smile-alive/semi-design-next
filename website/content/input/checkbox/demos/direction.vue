<script setup lang="ts">
    import { CheckboxGroup } from '@fibrae/semi-ui-vue';

    const options = [
        { label: '抖音', value: 'abc' },
        { label: '今日头条', value: 'toutiao' },
    ];
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" direction="horizontal" :options="options" />
</template>
