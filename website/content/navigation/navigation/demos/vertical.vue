<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBanner, IconForm, IconTreeSelect } from '@fibrae/semi-icons-vue/lab';
    import { Nav, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'union-management', text: '任务管理', items: ['任务设置', '任务查询', '信息录入'] },
        { itemKey: 'job', text: '公告管理', items: ['推送管理', '已推送查询'] },
    ];
    const icons = { user: IconBadge, union: IconTreeSelect, 'union-management': IconForm, job: IconBanner };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <div :style="{ width: '100%' }">
        <Nav :bodyStyle="{ height: '300px' }" :footer="{ collapseButton: true }" :items="items" @select="(data) => console.log(data)">
            <template #icon="{ item }">
                <component :is="iconOf(item)" />
            </template>
            <Nav.Header text="Semi 运营后台">
                <template #logo>
                    <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
                </template>
            </Nav.Header>
        </Nav>
    </div>
</template>
