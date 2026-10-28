<script setup lang="ts">
    import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-vue';
    import { Select } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="Select 示例" defaultValue="ulikecam" showClear style="width: 320px">
        <template #prefix>
            <IconVigoLogo />
        </template>
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" defaultValue="ulikecam" :showArrow="false" style="width: 320px">
        <template #prefix>
            <IconVigoLogo />
        </template>
        <template #suffix>
            <IconGift />
        </template>
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
</template>
