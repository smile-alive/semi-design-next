<script lang="ts">
    import { IconBell, IconBytedanceLogo, IconHelpCircle, IconHome, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-svelte';
    import { Avatar, Breadcrumb, Button, Layout, Nav, Skeleton } from '@fibrae/semi-ui-svelte';
</script>

{#snippet header()}
    <Nav.Header>
        <IconSemiLogo style="font-size: 36px" />
    </Nav.Header>
{/snippet}

{#snippet footer()}
    <Nav.Footer>
        <Button aria-label="通知" style="color: var(--semi-color-text-2); margin-inline-end: 12px" theme="borderless">
            {#snippet icon()}
                <IconBell size="large" />
            {/snippet}
        </Button>
        <Button aria-label="帮助" style="color: var(--semi-color-text-2); margin-inline-end: 12px" theme="borderless">
            {#snippet icon()}
                <IconHelpCircle size="large" />
            {/snippet}
        </Button>
        <Avatar color="orange" size="small">YJ</Avatar>
    </Nav.Footer>
{/snippet}

<Layout style="border: 1px solid var(--semi-color-border)">
    <Layout.Header style="background-color: var(--semi-color-bg-1)">
        <div>
            <Nav {footer} {header} mode="horizontal" selectedKeys={['Home']}>
                <Nav.Item itemKey="Home" text="首页">
                    {#snippet icon()}
                        <IconHome size="large" />
                    {/snippet}
                </Nav.Item>
                <Nav.Item itemKey="Live" text="直播">
                    {#snippet icon()}
                        <IconLive size="large" />
                    {/snippet}
                </Nav.Item>
                <Nav.Item itemKey="Setting" text="设置">
                    {#snippet icon()}
                        <IconSetting size="large" />
                    {/snippet}
                </Nav.Item>
            </Nav>
        </div>
    </Layout.Header>
    <Layout.Content style="padding: 24px; background-color: var(--semi-color-bg-0)">
        <Breadcrumb routes={['首页', '当这个页面标题很长时需要省略', '上一页', '详情页']} style="margin-block-end: 24px" />
        <div style="border-radius: 10px; border: 1px solid var(--semi-color-border); height: 376px; padding: 32px">
            <Skeleton loading>
                {#snippet placeholder()}
                    <Skeleton.Paragraph rows={2} />
                {/snippet}
                <p>Hi, Bytedance dance dance.</p>
                <p>Hi, Bytedance dance dance.</p>
            </Skeleton>
        </div>
    </Layout.Content>
    <Layout.Footer style="display: flex; justify-content: space-between; padding: 20px; color: var(--semi-color-text-2); background-color: var(--semi-grey-0)">
        <span style="display: flex; align-items: center">
            <IconBytedanceLogo size="large" style="margin-inline-end: 8px" />
            <span>Copyright © 2023 ByteDance. All Rights Reserved. </span>
        </span>
        <span>
            <span style="margin-inline-end: 24px">平台客服</span>
            <span>反馈建议</span>
        </span>
    </Layout.Footer>
</Layout>
