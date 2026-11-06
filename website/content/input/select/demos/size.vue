<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="small" placeholder="请选择业务线" size="small" :style="{ width: '180px' }">
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="default" placeholder="请选择业务线" :style="{ width: '180px' }">
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="large" placeholder="请选择业务线" size="large" :style="{ width: '180px' }">
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
    </Select>
</template>
