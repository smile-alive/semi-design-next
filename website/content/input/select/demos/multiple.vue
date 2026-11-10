<script setup lang="ts">
    import { Select, Toast } from '@fibrae/semi-ui-vue';

    const onExceed = () => Toast.warning('最多只允许选择两项');
</script>

<template>
    <Select aria-label="Select 示例" :defaultValue="['video', 'camera']" multiple style="width: 320px">
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" :defaultValue="['video', 'camera', 'editing']" :maxTagCount="2" multiple :restTagsPopoverProps="{ position: 'top' }" showRestTagsPopover style="width: 320px">
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" :defaultValue="['video']" :max="2" multiple style="width: 320px" @exceed="onExceed">
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" :defaultValue="['movie', 'camera', 'editing', 'video']" ellipsisTrigger expandRestTagsOnClick :maxTagCount="2" multiple :restTagsPopoverProps="{ position: 'top' }" showRestTagsPopover style="width: 220px">
        <Select.Option value="video">短视频</Select.Option>
        <Select.Option value="camera">相机</Select.Option>
        <Select.Option value="editing">剪辑</Select.Option>
        <Select.Option value="movie">长视频</Select.Option>
    </Select>
</template>
