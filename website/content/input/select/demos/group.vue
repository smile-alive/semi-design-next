<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Select aria-label="地区" filter placeholder="" style="width: 180px">
        <Select.OptGroup label="Asia">
            <Select.Option value="a-1">China</Select.Option>
            <Select.Option value="a-2">Korea</Select.Option>
        </Select.OptGroup>
        <Select.OptGroup label="Europe">
            <Select.Option value="b-1">Germany</Select.Option>
            <Select.Option value="b-2">France</Select.Option>
        </Select.OptGroup>
        <Select.OptGroup label="South America">
            <Select.Option value="c-1">Peru</Select.Option>
        </Select.OptGroup>
    </Select>
</template>
