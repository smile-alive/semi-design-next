<script setup lang="ts">
    import { IconBytedanceLogo, IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { IconBadge, IconBreadcrumb, IconSteps, IconTreeSelect } from '@fibrae/semi-icons-vue/lab';
    import { Avatar, Breadcrumb, Dropdown, Layout, Nav, Skeleton, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const currentYear = 2024;

    const operationItem: NavItemConfig = {
        itemKey: 'operation-management',
        text: '运营管理',
        items: ['人员管理', '人员变更'],
    };
    const topItems: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'approve-management', text: '审批管理', items: ['入驻审核', operationItem] },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const leftItems: NavItems = [
        { itemKey: 'approve-management', text: '审批管理', items: ['入驻审核', operationItem] },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
    ];
    const icons = { user: IconBadge, union: IconTreeSelect, 'approve-management': IconBreadcrumb, job: IconSteps };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
    const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];
</script>

<template>
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
        <Layout.Header :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
            <div>
                <Nav aria-label="顶部导航" :items="topItems" mode="horizontal" @select="(data) => console.log(data)">
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
        </Layout.Header>
        <Layout>
            <Layout.Sider :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
                <Nav aria-label="侧边导航" :footer="{ collapseButton: true }" :items="leftItems" :style="{ maxWidth: '220px', height: '100%' }">
                    <template #icon="{ item }">
                        <component :is="iconOf(item)" />
                    </template>
                </Nav>
            </Layout.Sider>
            <Layout.Content :style="{ padding: '24px', backgroundColor: 'var(--semi-color-bg-0)' }">
                <Breadcrumb :routes="routes" :style="{ marginBottom: '24px' }" />
                <div
                    :style="{
                        borderRadius: '10px',
                        border: '1px solid var(--semi-color-border)',
                        height: '376px',
                        padding: '32px',
                    }"
                >
                    <Skeleton loading>
                        <template #placeholder>
                            <Skeleton.Paragraph :rows="2" />
                        </template>
                        <p>Hi, Bytedance dance dance.</p>
                        <p>Hi, Bytedance dance dance.</p>
                    </Skeleton>
                </div>
            </Layout.Content>
        </Layout>
        <Layout.Footer
            :style="{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px',
                color: 'var(--semi-color-text-2)',
                backgroundColor: 'var(--semi-grey-0)',
            }"
        >
            <span :style="{ display: 'flex', alignItems: 'center' }">
                <IconBytedanceLogo size="large" :style="{ marginRight: '8px' }" />
                <span>Copyright © {{ currentYear }} ByteDance. All Rights Reserved. </span>
            </span>
            <span>
                <span :style="{ marginRight: '24px' }">平台客服</span>
                <span>反馈建议</span>
            </span>
        </Layout.Footer>
    </Layout>
</template>
