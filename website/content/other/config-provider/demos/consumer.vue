<script setup lang="ts">
    import { ConfigConsumer, ConfigProvider, TypographyText } from '@fibrae/semi-ui-vue';
</script>

<template>
    <ConfigProvider timeZone="GMT+08:00">
        <ConfigConsumer #default="value">
            <TypographyText :ellipsis="{ showTooltip: { opts: { style: { minWidth: '1200px' } } } }" :style="{ width: '600px' }">
                {{ JSON.stringify(value) }}
            </TypographyText>
        </ConfigConsumer>
    </ConfigProvider>
</template>
