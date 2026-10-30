<script lang="ts">
    import { TabItem, Tabs } from '../index';
    import type { TabItemProps, TabsProps } from '../interface';

    // `inside` puts the items in a custom bar of a Tabs; without it a lone TabItem renders outside any Tabs
    let { inside = false, itemProps, tabsProps }: { inside?: boolean; itemProps?: TabItemProps; tabsProps?: TabsProps } = $props();

    const tabList = [
        { itemKey: 'a', tab: 'A' },
        { itemKey: 'b', tab: 'B' },
    ];
</script>

{#snippet labelA()}A{/snippet}
{#snippet labelB()}B{/snippet}
{#snippet bar()}
    <div role="tablist">
        <TabItem itemKey="a" selected {...itemProps} tab={labelA} />
        <TabItem disabled itemKey="b" onClick={itemProps?.onClick} tab={labelB} />
    </div>
{/snippet}

{#if inside}
    <Tabs {...tabsProps} tabBar={bar} {tabList} />
{:else}
    <TabItem itemKey="a" {...itemProps} tab={labelA} />
{/if}
