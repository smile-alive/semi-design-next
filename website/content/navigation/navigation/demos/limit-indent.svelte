<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { IconBadge, IconBanner, IconForm, IconTabs } from '@fibrae/semi-icons-svelte/lab';
    import { Nav, NavHeader, type NavItems } from '@fibrae/semi-ui-svelte';

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
    <NavHeader text="Semi 运营后台">
        {#snippet logo()}
            <IconSemiLogo style="height: 36px; font-size: 36px" />
        {/snippet}
    </NavHeader>
{/snippet}

<Nav bodyStyle="height: 300px" footer={{ collapseButton: true }} {header} {items} limitIndent={false} onSelect={(data) => console.log(data)} openKeys={['job', 'mission1']}>
    {#snippet icon({ item, size })}
        {@const Icon = icons[item.itemKey as keyof typeof icons]}
        {#if Icon}
            <Icon {size} />
        {/if}
    {/snippet}
</Nav>
