<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBanner, IconForm, IconTabs } from '@fibrae/semi-icons-vue/lab';
    import { Nav, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        {
            text: '任务平台',
            itemKey: 'job',
            items: [
                '任务管理',
                {
                    text: '任务1',
                    itemKey: 'mission1',
                    items: ['任务2', { text: '任务3拆解', itemKey: 'mission3', items: ['子任务1', '子任务2'] }],
                },
            ],
        },
    ];
    const icons = { user: IconBadge, job: IconBanner, mission1: IconForm, mission3: IconTabs };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <Nav :bodyStyle="{ height: '300px' }" :defaultOpenKeys="['job', 'mission1']" :footer="{ collapseButton: true }" :items="items" :limitIndent="false" @select="(data) => console.log(data)">
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
