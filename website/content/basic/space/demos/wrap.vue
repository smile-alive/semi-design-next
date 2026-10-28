<script setup lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Space wrap>
        <Button v-for="i in 10" :key="i" theme="solid" type="secondary">按钮</Button>
    </Space>
</template>
