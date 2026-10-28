<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';

    const separators = ['-', '/', '|', '++'];
</script>

<template>
    <TagInput placeholder="使用 - 进行批量输入" separator="-" @change="(v) => console.log(v)" />
    <br />
    <br />
    <TagInput placeholder="支持多个分隔符进行批量输入" :separator="separators" @change="(v) => console.log(v)" />
</template>
