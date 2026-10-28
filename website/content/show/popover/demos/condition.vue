<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Popover, Space, Switch, Typography } from '@fibrae/semi-ui-vue';

    const { Text } = Typography;
    const enabled = ref(true);
    const content = computed(() => `condition is ${enabled.value ? 'true' : 'false'}`);
</script>

<template>
    <Space align="center">
        <Text id="popover-condition-label">condition</Text>
        <Switch v-model="enabled" aria-labelledby="popover-condition-label" />
        <Popover :condition="enabled">
            <Button>Hover me</Button>
            <template #content>{{ content }}</template>
        </Popover>
        <Popover :condition="enabled" trigger="click">
            <Button>Click me</Button>
            <template #content>{{ content }}</template>
        </Popover>
    </Space>
</template>
