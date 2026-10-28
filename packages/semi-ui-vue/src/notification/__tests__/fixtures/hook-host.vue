<script setup lang="ts">
    import { provide } from 'vue';
    import Notification from '../../index';
    import type { NotificationHookApi } from '../../interface';
    import { reachableKey } from './reachable';

    const props = defineProps<{ onApi: (api: NotificationHookApi) => void; reachable?: string }>();
    const [notification, Holder] = Notification.useNotification();
    if (props.reachable !== undefined) provide(reachableKey, props.reachable);
    props.onApi(notification);
</script>

<template>
    <div data-testid="holder"><Holder /></div>
</template>
