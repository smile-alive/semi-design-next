<script setup lang="ts">
    import { ref } from 'vue';
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBanner, IconForm, IconTree } from '@fibrae/semi-icons-vue/lab';
    import { Nav, type NavItemConfig, type NavItemKey, type NavItems } from '@fibrae/semi-ui-vue';

    const openKeys = ref<NavItemKey[]>(['union-management', 'job']);
    const selectedKeys = ref<NavItemKey[]>(['公告设置']);
    const isCollapsed = ref(true);

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'union-management', text: '任务管理', items: ['公告设置', '任务查询', '信息录入'] },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconBadge, union: IconBanner, 'union-management': IconForm, job: IconTree };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <Nav v-model:isCollapsed="isCollapsed" v-model:openKeys="openKeys" v-model:selectedKeys="selectedKeys" :bodyStyle="{ height: '300px' }" :footer="{ collapseButton: true }" :items="items" @openChange="(data) => console.log('trigger onOpenChange: ', data)" @select="(data) => console.log('trigger onSelect: ', data)">
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
