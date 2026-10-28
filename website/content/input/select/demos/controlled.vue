<script setup lang="ts">
    import { ref } from 'vue';
    import { Select } from '@fibrae/semi-ui-vue';

    const value = ref<string | undefined>('xigua');
</script>

<template>
    <Select v-model="value" aria-label="业务线" placeholder="受控的Select" style="width: 300px">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
</template>
