<script setup lang="ts">
    import { Space, Tag, type TagCloseEvent } from '@fibrae/semi-ui-vue';

    const preventClose = (event: TagCloseEvent) => event.preventDefault();
</script>

<template>
    <div>
        <Space>
            <Tag>default tag</Tag>
            <Tag closable>Closable Tag</Tag>
            <Tag closable @close="preventClose">Closable Tag, Prevent Default</Tag>
        </Space>
    </div>
</template>
