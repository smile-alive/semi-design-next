<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBanner, IconForm, IconTabs } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, type NavItems } from '@fibrae/semi-ui-svelte';

    const items: NavItems = [
        { itemKey: 'user', text: '用户管理' },
        {
            text: '任务平台',
            itemKey: 'job',
            items: [
                '任务管理',
                {
                    text: '任务1',
                    itemKey: 'mission1',
                    items: ['任务2', { text: '任务3拆解', itemKey: 'mission3', items: ['子任务1', '子任务2'] }],
                },
            ],
        },
    ];
    const icons = { user: IconBadge, job: IconBanner, mission1: IconForm, mission3: IconTabs };
</script>

{#snippet header()}
    <Nav.Header text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </Nav.Header>
{/snippet}

<Nav footer={{ collapseButton: true }} {header} {items} limitIndent={false} onSelect={(key) => console.log(key)} openKeys={['job', 'mission1']} styles={{ body: 'height: 300px' }}>
    {#snippet icon(renderProps)}
        {@const Icon = icons[renderProps.item.itemKey as keyof typeof icons]}
        {#if Icon}
            <Icon size={renderProps.size} />
        {/if}
    {/snippet}
</Nav>
