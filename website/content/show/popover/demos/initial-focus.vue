<script setup lang="ts">
    import { Button, Input, Popover, Space } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Popover trigger="click">
        <Button>click me</Button>
        <template #content="contentProps">
            <div :style="{ padding: '12px' }">
                <Space>
                    <Button>first focusable element</Button>
                    <Input :ref="contentProps.initialFocusRef" placeholder="focus here" />
                </Space>
            </div>
        </template>
    </Popover>
</template>
