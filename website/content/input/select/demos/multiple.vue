<script setup lang="ts">
    import { Select, Toast } from '@fibrae/semi-ui-vue';

    const onExceed = () => Toast.warning('最多只允许选择两项');
</script>

<template>
    <Select aria-label="Select 示例" :defaultValue="['douyin', 'ulikecam']" multiple style="width: 320px">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" :defaultValue="['douyin', 'ulikecam', 'jianying']" :maxTagCount="2" multiple :restTagsPopoverProps="{ position: 'top' }" showRestTagsPopover style="width: 320px">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" :defaultValue="['douyin']" :max="2" multiple style="width: 320px" @exceed="onExceed">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
    <br />
    <br />
    <Select aria-label="Select 示例" :defaultValue="['xigua', 'ulikecam', 'jianying', 'douyin']" ellipsisTrigger expandRestTagsOnClick :maxTagCount="2" multiple :restTagsPopoverProps="{ position: 'top' }" showRestTagsPopover style="width: 220px">
        <Select.Option value="douyin">抖音</Select.Option>
        <Select.Option value="ulikecam">轻颜相机</Select.Option>
        <Select.Option value="jianying">剪映</Select.Option>
        <Select.Option value="xigua">西瓜视频</Select.Option>
    </Select>
</template>
