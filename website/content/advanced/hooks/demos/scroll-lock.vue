<script setup lang="ts">
    import { ref } from 'vue';
    import { Space, Switch, Typography } from '@fibrae/semi-ui-vue';
    import { useScrollLock } from '@fibrae/semi-ui-vue/composables';

    const locked = ref(false);
    useScrollLock(() => locked.value);
</script>

<template>
    <Space>
        <Switch v-model="locked" aria-labelledby="scroll-lock-label" />
        <Typography.Text id="scroll-lock-label">锁定页面滚动</Typography.Text>
    </Space>
</template>
