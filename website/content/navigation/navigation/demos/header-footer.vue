<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBanner, IconForm } from '@fibrae/semi-icons-vue/lab';
    import { Nav, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'task', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconBadge, union: IconBanner, task: IconForm };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <Nav :bodyStyle="{ height: '300px' }" :defaultOpenKeys="['task']" :footer="{ collapseButton: true }" :items="items" @select="(data) => console.log(data)">
        <template #icon="{ item }">
            <component :is="iconOf(item)" />
        </template>
        <Nav.Header text="Semi 运营后台">
            <template #logo>
                <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
            </template>
        </Nav.Header>
    </Nav>
</template>
