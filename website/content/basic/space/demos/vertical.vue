<script setup lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Space vertical>
        <Button v-for="i in 4" :key="i" theme="solid" type="primary">按钮</Button>
    </Space>
</template>
