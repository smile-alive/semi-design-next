<script setup lang="ts">
    import { IconBell, IconBytedanceLogo, IconHelpCircle, IconHistogram, IconHome, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-vue';
    import { Avatar, Breadcrumb, Button, Layout, Nav, Skeleton, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const items: NavItems = [
        { itemKey: 'Home', text: '首页' },
        { itemKey: 'Histogram', text: '基础数据' },
        { itemKey: 'Live', text: '测试功能' },
        { itemKey: 'Setting', text: '设置' },
    ];
    const icons = { Home: IconHome, Histogram: IconHistogram, Live: IconLive, Setting: IconSetting };
    const iconOf = (item: NavItemConfig) => icons[item.itemKey as keyof typeof icons];
    const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];
    const actionStyle = { color: 'var(--semi-color-text-2)', marginRight: '12px' };
</script>

<template>
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
        <Layout.Header :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
            <div>
                <Nav aria-label="顶部导航" :defaultSelectedKeys="['Home']" mode="horizontal">
                    <Nav.Header>
                        <IconSemiLogo :style="{ height: '36px', fontSize: '36px' }" />
                    </Nav.Header>
                    <span :style="{ color: 'var(--semi-color-text-2)' }">
                        <span :style="{ marginRight: '24px', color: 'var(--semi-color-text-0)', fontWeight: '600' }"> 模版推荐 </span>
                        <span :style="{ marginRight: '24px' }">所有模版</span>
                        <span>我的模版</span>
                    </span>
                    <Nav.Footer>
                        <Button aria-label="通知" :style="actionStyle" theme="borderless">
                            <template #icon>
                                <IconBell size="large" />
                            </template>
                        </Button>
                        <Button aria-label="帮助" :style="actionStyle" theme="borderless">
                            <template #icon>
                                <IconHelpCircle size="large" />
                            </template>
                        </Button>
                        <Avatar color="orange" size="small">YJ</Avatar>
                    </Nav.Footer>
                </Nav>
            </div>
        </Layout.Header>
        <Layout>
            <Layout.Sider :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
                <Nav aria-label="侧边导航" :defaultSelectedKeys="['Home']" :footer="{ collapseButton: true }" :items="items" :style="{ maxWidth: '220px', height: '100%' }">
                    <template #icon="{ item }">
                        <component :is="iconOf(item)" size="large" />
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
                <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
            </span>
            <span>
                <span :style="{ marginRight: '24px' }">平台客服</span>
                <span>反馈建议</span>
            </span>
        </Layout.Footer>
    </Layout>
</template>
