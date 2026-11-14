<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBanner, IconForm, IconNavigation, IconNotification, IconSteps, IconTabs, IconTree, IconTreeSelect } from '@fibrae/semi-icons-vue/lab';
    import { Nav, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: '2', text: '订单管理' },
        { itemKey: '3', text: '资源管理' },
        { itemKey: '4', text: '任务平台', items: ['任务管理', '用户任务查询'] },
        { itemKey: '5', text: '推送通知' },
        { itemKey: '6', text: '任务' },
        { itemKey: '7', text: '活动管理' },
        { itemKey: '8', text: '内容工具' },
        { itemKey: '9', text: '快捷导航' },
    ];
    const icons = {
        user: IconBadge,
        '2': IconBanner,
        '3': IconTreeSelect,
        '4': IconForm,
        '5': IconNotification,
        '6': IconSteps,
        '7': IconTree,
        '8': IconTabs,
        '9': IconNavigation,
    };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <Nav :footer="{ collapseButton: true }" :items="items" :style="{ height: '520px' }" :styles="{ body: { height: '300px' } }" @select="(key) => console.log(key)">
        <template #icon="renderProps">
            <component :is="iconOf(renderProps.item)" />
        </template>
        <Nav.Header text="Semi 运营后台">
            <template #logo>
                <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
            </template>
        </Nav.Header>
    </Nav>
</template>
