<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';

    const defaultValue = ['抖音', '火山'];
</script>

<template>
    <TagInput :defaultValue="defaultValue" placeholder="请输入..." showClear @change="(v) => console.log(v)" />
</template>
