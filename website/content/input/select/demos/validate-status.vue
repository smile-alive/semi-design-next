<script setup lang="ts">
    import { Select, SelectOption } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="default" :style="{ width: '180px' }">
        <SelectOption value="ulikecam">轻颜相机</SelectOption>
    </Select>
    <br />
    <br />
    <Select aria-label="warning" :style="{ width: '180px' }" validateStatus="warning">
        <SelectOption value="ulikecam">轻颜相机</SelectOption>
    </Select>
    <br />
    <br />
    <Select aria-label="error" :style="{ width: '180px' }" validateStatus="error">
        <SelectOption value="ulikecam">轻颜相机</SelectOption>
    </Select>
</template>
