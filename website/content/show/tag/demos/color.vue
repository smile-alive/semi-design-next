<script setup lang="ts">
    import { Space, Tag, type TagColor } from '@fibrae/semi-ui-vue';

    const colors: TagColor[] = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow', 'white'];
</script>

<template>
    <Space wrap>
        <Tag v-for="color in colors" :key="color" :color="color">{{ color }}</Tag>
    </Space>
</template>
