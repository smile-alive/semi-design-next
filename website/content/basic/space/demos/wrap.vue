<script setup lang="ts">
    import { Button, Space } from '@fibrae/semi-ui-vue';

    const tenButtons = Array.from({ length: 10 }, (_, index) => index);
</script>

<template>
    <Space wrap>
        <Button v-for="item in tenButtons" :key="item" theme="solid" type="secondary">按钮</Button>
    </Space>
</template>
