<script setup lang="ts">
    import { ref } from 'vue';
    import { Select } from '@fibrae/semi-ui-vue';

    const value = ref<string | undefined>('movie');
</script>

<template>
    <Select v-model="value" aria-label="业务线" placeholder="受控的Select" style="width: 300px">
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
</template>
