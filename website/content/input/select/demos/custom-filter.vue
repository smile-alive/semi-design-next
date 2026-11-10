<script setup lang="ts">
    import { Select, type SelectOptionProps } from '@fibrae/semi-ui-vue';

    const searchLabel = (sugInput: string, option: SelectOptionProps) => {
        const label = String(option.label).toUpperCase();
        const sug = sugInput.toUpperCase();
        return label.includes(sug);
    };
</script>

<template>
    <Select aria-label="业务线" :filter="searchLabel" placeholder="try video" style="width: 180px">
        <Select.Option value="video">video</Select.Option>
        <Select.Option value="camera">LIVE</Select.Option>
        <Select.Option value="editing">COMMUNITY</Select.Option>
        <Select.Option value="movie">MOVIE</Select.Option>
    </Select>
</template>
