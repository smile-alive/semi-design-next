<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput
        :defaultValue="['抖音']"
        placeholder="请输入..."
        showClear
        @add="(tag) => console.log(`onAdd，新增：${tag}`)"
        @blur="() => console.log('onBlur')"
        @change="(tag) => console.log(`onChange,当前标签数组：${tag}`)"
        @focus="() => console.log('onFocus')"
        @inputChange="(input) => console.log(`onInputChange，当前输入内容：${input}`)"
        @remove="(v, i) => console.log(`onRemove，移除：${v}, 序号：${i}`)"
    />
</template>
