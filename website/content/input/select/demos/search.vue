<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="单选" filter placeholder="带搜索功能的单选" style="width: 180px">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="多选" :autoClearSearchValue="false" filter multiple placeholder="带搜索功能的多选" style="width: 300px">
        <Select.Option value="semi-0">Semi-0</Select.Option>
        <Select.Option value="semi-1">Semi-1</Select.Option>
        <Select.Option value="semi-2">Semi-2</Select.Option>
        <Select.Option value="semi-3">Semi-3</Select.Option>
        <Select.Option value="semi-4">Semi-4</Select.Option>
    </Select>
</template>
