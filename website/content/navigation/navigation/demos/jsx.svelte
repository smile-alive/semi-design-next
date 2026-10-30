<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconForm, IconTree } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, NavFooter, NavHeader, NavItem, SubNav } from '@fibrae/semi-ui-svelte';
</script>

{#snippet header()}
    <NavHeader text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </NavHeader>
{/snippet}

{#snippet footer()}
    <NavFooter collapseButton />
{/snippet}

<Nav bodyStyle="height: 300px" {footer} {header} onClick={(data) => console.log('trigger onClick: ', data)} onSelect={(data) => console.log('trigger onSelect: ', data)} openKeys={['user']}>
    <NavItem itemKey="union" text="活动管理">
        {#snippet icon({ size })}
            <IconForm {size} />
        {/snippet}
    </NavItem>
    <SubNav itemKey="user" text="用户管理">
        {#snippet icon({ size })}
            <IconBadge {size} />
        {/snippet}
        <NavItem itemKey="active" text="活跃用户" />
        <NavItem itemKey="negative" text="非活跃用户" />
    </SubNav>
    <SubNav itemKey="union-management" text="任务管理">
        {#snippet icon({ size })}
            <IconTree {size} />
        {/snippet}
        <NavItem itemKey="notice" text="任务设置" />
        <NavItem itemKey="query" text="任务查询" />
        <NavItem itemKey="info" text="信息录入" />
    </SubNav>
</Nav>
