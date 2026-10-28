<script setup lang="ts">
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import ConfigProvider from '../../../config-provider';
    import Notification from '../../index';
    import type { NotificationHookApi } from '../../interface';

    const props = defineProps<{ onApi: (api: NotificationHookApi) => void }>();
    const [notification, Holder] = Notification.useNotification();
    props.onApi(notification);
</script>

<template>
    <ConfigProvider direction="rtl" :locale="ja_JP">
        <div data-testid="holder"><Holder /></div>
    </ConfigProvider>
</template>
