<script setup lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import { ConfigConsumer, ConfigProvider } from '@fibrae/semi-ui-vue';
</script>

<template>
    <ConfigProvider direction="ltr" :locale="en_US" timeZone="Asia/Tokyo">
        <ConfigConsumer #default="config">
            <div :style="{ margin: '8px' }">外层：locale = {{ config.locale?.code ?? '未设置' }}，timeZone = {{ String(config.timeZone) }}，direction = {{ config.direction }}</div>
        </ConfigConsumer>
        <ConfigProvider :timeZone="8">
            <ConfigConsumer #default="config">
                <div :style="{ margin: '8px' }">内层只传 timeZone，其余继承外层：locale = {{ config.locale?.code ?? '未设置' }}，timeZone = {{ String(config.timeZone) }}，direction = {{ config.direction }}</div>
            </ConfigConsumer>
        </ConfigProvider>
    </ConfigProvider>
</template>
