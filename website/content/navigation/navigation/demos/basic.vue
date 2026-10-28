<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconAvatar, IconDescriptions, IconTree } from '@fibrae/semi-icons-vue/lab';
    import { Nav, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconAvatar, union: IconDescriptions, job: IconTree };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <Nav :bodyStyle="{ height: '320px' }" :footer="{ collapseButton: true }" :items="items" @click="(data) => console.log('trigger onClick: ', data)" @select="(data) => console.log('trigger onSelect: ', data)">
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
