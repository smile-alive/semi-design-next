<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconAvatar, IconDescriptions, IconTree } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, type NavItems } from '@fibrae/semi-ui-svelte';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        { itemKey: 'union', text: '活动管理' },
        { itemKey: 'job', text: '任务平台', items: ['任务管理', '用户任务查询'] },
    ];
    const icons = { user: IconAvatar, union: IconDescriptions, job: IconTree };
</script>

{#snippet header()}
    <Nav.Header text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </Nav.Header>
{/snippet}

<Nav bodyStyle="height: 320px" footer={{ collapseButton: true }} {header} {items} onClick={(data) => console.log('trigger onClick: ', data)} onSelect={(data) => console.log('trigger onSelect: ', data)}>
    {#snippet icon(renderProps)}
        {@const Icon = icons[renderProps.item.itemKey as keyof typeof icons]}
        {#if Icon}
            <Icon size={renderProps.size} />
        {/if}
    {/snippet}
</Nav>
