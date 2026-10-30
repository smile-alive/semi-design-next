<script lang="ts">
    import { IconBell, IconBytedanceLogo, IconHelpCircle, IconHistogram, IconHome, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-svelte';
    import { Avatar, Breadcrumb, Button, Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutSider, Nav, NavFooter, NavHeader, Skeleton, SkeletonParagraph, type NavItems } from '@fibrae/semi-ui-svelte';

    const items: NavItems = [
        { itemKey: 'Home', text: '首页' },
        { itemKey: 'Histogram', text: '基础数据' },
        { itemKey: 'Live', text: '测试功能' },
        { itemKey: 'Setting', text: '设置' },
    ];
    const icons = { Home: IconHome, Histogram: IconHistogram, Live: IconLive, Setting: IconSetting };
    const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];
    const actionStyle = 'color: var(--semi-color-text-2); margin-inline-end: 12px';
</script>

{#snippet topHeader()}
    <NavHeader>
        <IconSemiLogo style="height: 36px; font-size: 36px" />
    </NavHeader>
{/snippet}

{#snippet topFooter()}
    <NavFooter>
        <Button aria-label="通知" style={actionStyle} theme="borderless">
            {#snippet icon()}
                <IconBell size="large" />
            {/snippet}
        </Button>
        <Button aria-label="帮助" style={actionStyle} theme="borderless">
            {#snippet icon()}
                <IconHelpCircle size="large" />
            {/snippet}
        </Button>
        <Avatar color="orange" size="small">YJ</Avatar>
    </NavFooter>
{/snippet}

<Layout style="border: 1px solid var(--semi-color-border)">
    <LayoutHeader style="background-color: var(--semi-color-bg-1)">
        <div>
            <Nav aria-label="顶部导航" footer={topFooter} header={topHeader} mode="horizontal" selectedKeys={['Home']}>
                <!-- Nav renders its children straight into the list, so other content needs its own li -->
                <li style="display: contents">
                    <span style="color: var(--semi-color-text-2)">
                        <span style="margin-inline-end: 24px; color: var(--semi-color-text-0); font-weight: 600">模版推荐</span>
                        <span style="margin-inline-end: 24px">所有模版</span>
                        <span>我的模版</span>
                    </span>
                </li>
            </Nav>
        </div>
    </LayoutHeader>
    <Layout>
        <LayoutSider style="background-color: var(--semi-color-bg-1)">
            <Nav aria-label="侧边导航" footer={{ collapseButton: true }} {items} selectedKeys={['Home']} style="max-width: 220px; height: 100%">
                {#snippet icon({ item })}
                    {@const Icon = icons[item.itemKey as keyof typeof icons]}
                    <Icon size="large" />
                {/snippet}
            </Nav>
        </LayoutSider>
        <LayoutContent style="padding: 24px; background-color: var(--semi-color-bg-0)">
            <Breadcrumb {routes} style="margin-bottom: 24px" />
            <div style="border-radius: 10px; border: 1px solid var(--semi-color-border); height: 376px; padding: 32px">
                <Skeleton loading>
                    {#snippet placeholder()}
                        <SkeletonParagraph rows={2} />
                    {/snippet}
                    <p>Hi, Bytedance dance dance.</p>
                    <p>Hi, Bytedance dance dance.</p>
                </Skeleton>
            </div>
        </LayoutContent>
    </Layout>
    <LayoutFooter style="display: flex; justify-content: space-between; padding: 20px; color: var(--semi-color-text-2); background-color: var(--semi-grey-0)">
        <span style="display: flex; align-items: center">
            <IconBytedanceLogo size="large" style="margin-inline-end: 8px" />
            <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
        </span>
        <span>
            <span style="margin-inline-end: 24px">平台客服</span>
            <span>反馈建议</span>
        </span>
    </LayoutFooter>
</Layout>
