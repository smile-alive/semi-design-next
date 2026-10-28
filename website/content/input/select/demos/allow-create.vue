<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];
</script>

<template>
    <Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple :optionList="optionList" style="width: 400px" @change="(value) => console.log(value)" />
    <br />
    <br />
    <Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple :optionList="optionList" placeholder="With renderCreateItem" style="width: 400px" @change="(value) => console.log(value)">
        <template #createItem="{ inputValue, style }">
            <div :style="[{ padding: '10px' }, style]">Create Item：{{ inputValue }}</div>
        </template>
    </Select>
</template>
