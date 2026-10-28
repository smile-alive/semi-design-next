<script setup lang="ts">
    import { Select, SelectOption } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="small" placeholder="请选择业务线" size="small" :style="{ width: '180px' }">
        <SelectOption value="ulikecam">轻颜相机</SelectOption>
    </Select>
    <br />
    <br />
    <Select aria-label="default" placeholder="请选择业务线" :style="{ width: '180px' }">
        <SelectOption value="ulikecam">轻颜相机</SelectOption>
    </Select>
    <br />
    <br />
    <Select aria-label="large" placeholder="请选择业务线" size="large" :style="{ width: '180px' }">
        <SelectOption value="ulikecam">轻颜相机</SelectOption>
    </Select>
</template>
