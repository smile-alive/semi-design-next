<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput addOnBlur :defaultValue="['抖音', '火山', '西瓜视频']" placeholder="请输入..." @change="(v) => console.log(v)" />
</template>
