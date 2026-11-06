<script setup lang="ts">
    import { ConfigConsumer, ConfigProvider, Typography } from '@fibrae/semi-ui-vue';
</script>

<template>
    <ConfigProvider timeZone="GMT+08:00">
        <ConfigConsumer #default="value">
            <Typography.Text :ellipsis="{ showTooltip: { opts: { style: { minWidth: '1200px' } } } }" :style="{ width: '600px' }">
                {{ JSON.stringify(value) }}
            </Typography.Text>
        </ConfigConsumer>
    </ConfigProvider>
</template>
