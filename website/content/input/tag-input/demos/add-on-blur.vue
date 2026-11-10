<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput addOnBlur :defaultValue="['短视频', '直播', '长视频']" placeholder="请输入..." @change="(v) => console.log(v)" />
</template>
