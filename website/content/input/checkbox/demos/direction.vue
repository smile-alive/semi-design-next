<script setup lang="ts">
    import { CheckboxGroup } from '@fibrae/semi-ui-vue';

    const options = [
        { label: '短视频', value: 'video' },
        { label: '资讯', value: 'news' },
    ];
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" direction="horizontal" :options="options" />
</template>
