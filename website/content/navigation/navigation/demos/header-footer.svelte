<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBanner, IconForm } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, type NavItems } from '@fibrae/semi-ui-svelte';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'task', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconBadge, union: IconBanner, task: IconForm };
</script>

{#snippet header()}
    <Nav.Header text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </Nav.Header>
{/snippet}

<Nav footer={{ collapseButton: true }} {header} {items} onSelect={(key) => console.log(key)} openKeys={['task']} styles={{ body: 'height: 300px' }}>
    {#snippet icon(renderProps)}
        {@const Icon = icons[renderProps.item.itemKey as keyof typeof icons]}
        {#if Icon}
            <Icon size={renderProps.size} />
        {/if}
    {/snippet}
</Nav>
