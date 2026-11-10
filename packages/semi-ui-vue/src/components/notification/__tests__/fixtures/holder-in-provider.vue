<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import { en_US } from '@fibrae/semi-ui-vue/locale';
    import Notification from '../../index';
    import type { NotificationHookApi } from '../../interface';

    const props = defineProps<{ onApi: (api: NotificationHookApi) => void }>();
    const [notification, Holder] = Notification.useNotification();
    props.onApi(notification);
</script>

<template>
    <ConfigProvider direction="rtl" :locale="en_US">
        <div data-testid="holder"><Holder /></div>
    </ConfigProvider>
</template>
