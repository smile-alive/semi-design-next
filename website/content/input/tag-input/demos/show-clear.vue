<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput :defaultValue="['抖音', '火山']" placeholder="请输入..." showClear @change="(v) => console.log(v)" />
</template>
