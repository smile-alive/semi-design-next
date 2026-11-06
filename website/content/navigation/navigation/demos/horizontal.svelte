<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBreadcrumb, IconSteps, IconTreeSelect } from '@fibrae/semi-icons-svelte/lab';
    import { Avatar, Dropdown, Nav, type NavItems } from '@fibrae/semi-ui-svelte';

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
            <Avatar color="light-blue" size="small" style="margin: 4px">BD</Avatar>
            <span>Bytedancer</span>
            {#snippet content()}
                <Dropdown.Menu>
                    <Dropdown.Item>详情</Dropdown.Item>
                    <Dropdown.Item>退出</Dropdown.Item>
                </Dropdown.Menu>
            {/snippet}
        </Dropdown>
    </Nav.Footer>
{/snippet}

<div style="width: 100%">
    <Nav {footer} {header} {items} mode="horizontal" onSelect={(key) => console.log(key)}>
        {#snippet icon(renderProps)}
            {@const Icon = icons[renderProps.item.itemKey as keyof typeof icons]}
            {#if Icon}
                <Icon size={renderProps.size} />
            {/if}
        {/snippet}
    </Nav>
</div>
