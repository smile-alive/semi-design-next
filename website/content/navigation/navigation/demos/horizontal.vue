<script setup lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBreadcrumb, IconSteps, IconTreeSelect } from '@fibrae/semi-icons-vue/lab';
    import { Avatar, Dropdown, Nav, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        {
            itemKey: 'approve-management',
            text: '审批管理',
            items: ['入驻审核', { itemKey: 'operation-management', text: '运营管理', items: ['人员管理', '人员变更'] }],
        },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconBadge, union: IconTreeSelect, 'approve-management': IconBreadcrumb, job: IconSteps };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
</script>

<template>
    <div :style="{ width: '100%' }">
        <Nav :items="items" mode="horizontal" @select="(data) => console.log(data)">
            <template #icon="{ item }">
                <component :is="iconOf(item)" />
            </template>
            <template #footer>
                <Dropdown position="bottomRight">
                    <Avatar color="light-blue" size="small" :style="{ margin: '4px' }">BD</Avatar>
                    <span>Bytedancer</span>
                    <template #content>
                        <Dropdown.Menu>
                            <Dropdown.Item>详情</Dropdown.Item>
                            <Dropdown.Item>退出</Dropdown.Item>
                        </Dropdown.Menu>
                    </template>
                </Dropdown>
            </template>
            <Nav.Header text="Semi 运营后台">
                <template #logo>
                    <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
                </template>
            </Nav.Header>
        </Nav>
    </div>
</template>
