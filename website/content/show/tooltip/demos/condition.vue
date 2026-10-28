<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Space, Switch, Tooltip, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;
    const enabled = ref(true);
    const content = computed(() => `condition is ${enabled.value ? 'true' : 'false'}`);
</script>

<template>
    <Space align="center">
        <Text id="tooltip-condition-label">condition</Text>
        <Switch v-model="enabled" aria-labelledby="tooltip-condition-label" />
        <Tooltip :condition="enabled" trigger="hover">
            <Button>Hover me</Button>
            <template #content>{{ content }}</template>
        </Tooltip>
        <Tooltip :condition="enabled" trigger="click">
            <Button>Click me</Button>
            <template #content>{{ content }}</template>
        </Tooltip>
    </Space>
</template>
