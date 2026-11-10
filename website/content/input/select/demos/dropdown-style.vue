<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="业务线" :dropdownStyle="{ width: '250px' }" dropdownClassName="test" placeholder="自定义弹出层样式的" style="width: 180px">
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
</template>
