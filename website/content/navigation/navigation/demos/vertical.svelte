<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBanner, IconForm, IconTreeSelect } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, NavHeader, type NavItems } from '@fibrae/semi-ui-svelte';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'union-management', text: '任务管理', items: ['任务设置', '任务查询', '信息录入'] },
        { itemKey: 'job', text: '公告管理', items: ['推送管理', '已推送查询'] },
    ];
    const icons = { user: IconBadge, union: IconTreeSelect, 'union-management': IconForm, job: IconBanner };
</script>

{#snippet header()}
    <NavHeader text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </NavHeader>
{/snippet}

<div style="width: 100%">
    <Nav bodyStyle="height: 300px" footer={{ collapseButton: true }} {header} {items} onSelect={(data) => console.log(data)}>
        {#snippet icon({ item, size })}
            {@const Icon = icons[item.itemKey as keyof typeof icons]}
            {#if Icon}
                <Icon {size} />
            {/if}
        {/snippet}
    </Nav>
</div>
