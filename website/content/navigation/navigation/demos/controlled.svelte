<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBanner, IconForm, IconTree } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, NavHeader, type NavItemKey, type NavItems } from '@fibrae/semi-ui-svelte';

    let openKeys = $state<NavItemKey[]>(['union-management', 'job']);
    let selectedKeys = $state<NavItemKey[]>(['公告设置']);
    let isCollapsed = $state(true);

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'union-management', text: '任务管理', items: ['公告设置', '任务查询', '信息录入'] },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconBadge, union: IconBanner, 'union-management': IconForm, job: IconTree };
</script>

{#snippet header()}
    <NavHeader text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </NavHeader>
{/snippet}

<Nav bind:isCollapsed bind:openKeys bind:selectedKeys bodyStyle="height: 300px" footer={{ collapseButton: true }} {header} {items} onOpenChange={(data) => console.log('trigger onOpenChange: ', data)} onSelect={(data) => console.log('trigger onSelect: ', data)}>
    {#snippet icon({ item, size })}
        {@const Icon = icons[item.itemKey as keyof typeof icons]}
        {#if Icon}
            <Icon {size} />
        {/if}
    {/snippet}
</Nav>
