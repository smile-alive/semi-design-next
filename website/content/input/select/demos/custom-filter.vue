<script setup lang="ts">
    import { Select, type SelectOptionProps } from '@fibrae/semi-ui-vue';

    function searchLabel(sugInput: string, option: SelectOptionProps) {
        const label = String(option.label).toUpperCase();
        const sug = sugInput.toUpperCase();
        return label.includes(sug);
    }
</script>

<template>
    <Select aria-label="业务线" :filter="searchLabel" placeholder="try douyin" style="width: 180px">
        <Select.Option value="douyin">douyin</Select.Option>
        <Select.Option value="ulikecam">HOTSOON</Select.Option>
        <Select.Option value="jianying">PIPIXIA</Select.Option>
        <Select.Option value="xigua">XIGUA</Select.Option>
    </Select>
</template>
