<script setup lang="ts">
    import { h } from 'vue';
    import { IconBell, IconHome } from '@fibrae/semi-icons-vue';
    import { Button, Notification } from '@fibrae/semi-ui-vue';

    const opts = {
        title: 'Hi, Semi',
        content: 'ies dance dance dance',
        duration: 3,
    };

    // icon is a VNode or a render function, which a template cannot express
    const showIcon = (icon: typeof IconHome, color?: string) => Notification.info({ ...opts, icon: h(icon, color ? { style: { color } } : null) });
</script>

<template>
    <h5>默认的图标</h5>
    <Button :style="{ margin: '4px' }" type="primary" @click="Notification.success(opts)">Success</Button>
    <Button :style="{ margin: '4px' }" @click="Notification.info(opts)">Info</Button>
    <Button :style="{ margin: '4px' }" type="warning" @click="Notification.warning(opts)">Warning</Button>
    <Button :style="{ margin: '4px' }" type="danger" @click="Notification.error(opts)">Error</Button>
    <h5>自定义图标</h5>
    <Button aria-label="铃铛图标通知" :style="{ marginInlineEnd: '5px' }" @click="showIcon(IconBell, 'red')">
        <template #icon>
            <IconBell />
        </template>
    </Button>
    <Button aria-label="主页图标通知" :style="{ marginInlineEnd: '5px' }" @click="showIcon(IconHome)">
        <template #icon>
            <IconHome />
        </template>
    </Button>
    <Button aria-label="粉色主页图标通知" @click="showIcon(IconHome, 'pink')">
        <template #icon>
            <IconHome />
        </template>
    </Button>
</template>
