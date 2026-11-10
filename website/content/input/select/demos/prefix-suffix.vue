<script setup lang="ts">
    import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-vue';
    import { Select } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="Select 示例" defaultValue="camera" showClear style="width: 320px">
        <template #prefix>
            <IconVigoLogo />
        </template>
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" defaultValue="camera" :showArrow="false" style="width: 320px">
        <template #prefix>
            <IconVigoLogo />
        </template>
        <template #suffix>
            <IconGift />
        </template>
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
</template>
