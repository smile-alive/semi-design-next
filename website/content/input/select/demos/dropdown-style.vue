<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

    const dropdownStyle = { width: '250px' };
</script>

<template>
    <Select aria-label="业务线" :dropdownStyle="dropdownStyle" dropdownClassName="test" placeholder="自定义弹出层样式的" style="width: 180px">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
</template>
