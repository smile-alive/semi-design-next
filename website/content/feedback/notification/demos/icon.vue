<script setup lang="ts">
    import { h } from 'vue';
    import { IconToutiaoLogo, IconVigoLogo } from '@fibrae/semi-icons-vue';
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        title: 'Hi, Bytedance',
        content: 'ies dance dance dance',
        duration: 3,
    };

    // icon is a VNode or a render function, which a template cannot express
    const showIcon = (icon: typeof IconVigoLogo, color?: string) => Notification.info({ ...opts, icon: h(icon, color ? { style: { color } } : null) });
</script>

<template>
    <h5>默认的图标</h5>
    <Button :style="{ margin: '4px' }" type="primary" @click="Notification.success(opts)">Success</Button>
    <Button :style="{ margin: '4px' }" @click="Notification.info(opts)">Info</Button>
    <Button :style="{ margin: '4px' }" type="warning" @click="Notification.warning(opts)">Warning</Button>
    <Button :style="{ margin: '4px' }" type="danger" @click="Notification.error(opts)">Error</Button>
    <h5>自定义图标</h5>
    <Button aria-label="Toutiao 图标通知" :style="{ marginRight: '5px' }" @click="showIcon(IconToutiaoLogo, 'red')">
        <template #icon>
            <IconToutiaoLogo />
        </template>
    </Button>
    <Button aria-label="Vigo 图标通知" :style="{ marginRight: '5px' }" @click="showIcon(IconVigoLogo)">
        <template #icon>
            <IconVigoLogo />
        </template>
    </Button>
    <Button aria-label="粉色 Vigo 图标通知" @click="showIcon(IconVigoLogo, 'pink')">
        <template #icon>
            <IconVigoLogo />
        </template>
    </Button>
</template>
