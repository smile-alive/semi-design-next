<script setup lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-vue';

    const fourButtons = [1, 2, 3, 4];
</script>

<template>
    <Space vertical>
        <Button v-for="item in fourButtons" :key="item" theme="solid" type="primary">按钮</Button>
    </Space>
</template>
