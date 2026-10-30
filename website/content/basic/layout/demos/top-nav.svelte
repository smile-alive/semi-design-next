<script lang="ts">
    import { IconBell, IconBytedanceLogo, IconHelpCircle, IconHome, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-svelte';
    import { Avatar, Breadcrumb, Button, Layout, LayoutContent, LayoutFooter, LayoutHeader, Nav, NavFooter, NavHeader, NavItem, Skeleton, SkeletonParagraph } from '@fibrae/semi-ui-svelte';

    const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];
    const actionStyle = 'color: var(--semi-color-text-2); margin-inline-end: 12px';
</script>

{#snippet header()}
    <NavHeader>
        <IconSemiLogo style="font-size: 36px" />
    </NavHeader>
{/snippet}

{#snippet footer()}
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
            <Nav {footer} {header} mode="horizontal" selectedKeys={['Home']}>
                <NavItem itemKey="Home" text="首页">
                    {#snippet icon()}
                        <IconHome size="large" />
                    {/snippet}
                </NavItem>
                <NavItem itemKey="Live" text="直播">
                    {#snippet icon()}
                        <IconLive size="large" />
                    {/snippet}
                </NavItem>
                <NavItem itemKey="Setting" text="设置">
                    {#snippet icon()}
                        <IconSetting size="large" />
                    {/snippet}
                </NavItem>
            </Nav>
        </div>
    </LayoutHeader>
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
