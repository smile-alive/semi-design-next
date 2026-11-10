<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBreadcrumb, IconSteps, IconTreeSelect } from '@fibrae/semi-icons-svelte/lab';
    import { Avatar, Breadcrumb, Dropdown, Layout, Nav, Skeleton, type NavIconArgs, type NavItemConfig, type NavItemRenderProps, type NavItems } from '@fibrae/semi-ui-svelte';

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
    const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];
</script>

{#snippet header()}
    <Nav.Header text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </Nav.Header>
{/snippet}

{#snippet footer()}
    <Nav.Footer>
        <Dropdown position="bottomRight">
            <Avatar color="light-blue" size="small" style="margin: 4px">SD</Avatar>
            <span>Semi</span>
            {#snippet content()}
                <Dropdown.Menu>
                    <Dropdown.Item>详情</Dropdown.Item>
                    <Dropdown.Item>退出</Dropdown.Item>
                </Dropdown.Menu>
            {/snippet}
        </Dropdown>
    </Nav.Footer>
{/snippet}

{#snippet icon(renderProps: NavIconArgs & NavItemRenderProps)}
    {@const Icon = icons[renderProps.item.itemKey as keyof typeof icons]}
    {#if Icon}
        <Icon size={renderProps.size} />
    {/if}
{/snippet}

<Layout style="border: 1px solid var(--semi-color-border)">
    <Layout.Header style="background-color: var(--semi-color-bg-1)">
        <div>
            <Nav aria-label="顶部导航" {footer} {header} {icon} items={topItems} mode="horizontal" onSelect={(key) => console.log(key)} />
        </div>
    </Layout.Header>
    <Layout>
        <Layout.Sider style="background-color: var(--semi-color-bg-1)">
            <Nav aria-label="侧边导航" footer={{ collapseButton: true }} {icon} items={leftItems} style="max-width: 220px; height: 100%" />
        </Layout.Sider>
        <Layout.Content style="padding: 24px; background-color: var(--semi-color-bg-0)">
            <Breadcrumb {routes} style="margin-block-end: 24px" />
            <div style="border-radius: 10px; border: 1px solid var(--semi-color-border); height: 376px; padding: 32px">
                <Skeleton loading>
                    {#snippet placeholder()}
                        <Skeleton.Paragraph rows={2} />
                    {/snippet}
                    <p>Hi, Semi dance dance.</p>
                    <p>Hi, Semi dance dance.</p>
                </Skeleton>
            </div>
        </Layout.Content>
    </Layout>
    <Layout.Footer style="display: flex; justify-content: space-between; padding: 20px; color: var(--semi-color-text-2); background-color: var(--semi-grey-0)">
        <span style="display: flex; align-items: center">
            <IconSemiLogo size="large" style="margin-inline-end: 8px" />
            <span>Copyright © {currentYear} Semi Design Next. All Rights Reserved. </span>
        </span>
        <span>
            <span style="margin-inline-end: 24px">平台客服</span>
            <span>反馈建议</span>
        </span>
    </Layout.Footer>
</Layout>
