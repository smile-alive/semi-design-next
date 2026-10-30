<script lang="ts">
    import { IconFile, IconGlobe, IconHelpCircle } from '@fibrae/semi-icons-svelte';
    import { Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    const tabList: PlainTab[] = [
        { itemKey: '1', tab: '文档' },
        { itemKey: '2', tab: '快速起步' },
        { itemKey: '3', tab: '帮助' },
    ];
    const icons = { '1': IconFile, '2': IconGlobe, '3': IconHelpCircle } as const;
</script>

<Tabs {tabList}>
    {#snippet tab({ item })}
        {@const Icon = icons[item.itemKey as keyof typeof icons]}
        <span><Icon />{item.tab}</span>
    {/snippet}
    {#snippet panel({ item })}{item.tab}{/snippet}
</Tabs>
