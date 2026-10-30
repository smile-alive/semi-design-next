<script setup lang="ts">
    import { inject, provide, ref, type InjectionKey } from 'vue';
    import { Button, Notification, Space } from '@fibrae/semi-ui-vue';

    const reachableKey: InjectionKey<string> = Symbol('reachable');
    provide(reachableKey, 'Light');

    const [notification, Holder] = Notification.useNotification();
    const ids = ref<string[]>([]);
    // The function is rendered as a functional component inside the notification, so it can inject from where Holder sits
    const content = () => `ReachableContext: ${inject(reachableKey)}`;

    const show = () => {
        ids.value.push(notification.info({ title: 'Hook Notification', content, duration: 0 }));
    };

    const hide = () => {
        const first = ids.value.shift();
        if (first) {
            notification.close(first);
        }
    };
</script>

<template>
    <Space>
        <Button @click="show">Show Notification</Button>
        <Button @click="hide">Hide Notification</Button>
    </Space>
    <Holder />
</template>
