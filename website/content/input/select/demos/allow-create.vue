<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'news', label: '资讯' },
    ];
</script>

<template>
    <Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple :optionList="optionList" style="width: 400px" @change="(value) => console.log(value)" />
    <br />
    <br />
    <Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple :optionList="optionList" placeholder="With renderCreateItem" style="width: 400px" @change="(value) => console.log(value)">
        <template #createItem="create">
            <div :style="[{ padding: '10px' }, create.style]">Create Item：{{ create.inputValue }}</div>
        </template>
    </Select>
</template>
