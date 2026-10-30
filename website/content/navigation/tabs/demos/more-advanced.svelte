<script lang="ts">
    import { Button, Tabs, type PlainTab, type TabsMore } from '@fibrae/semi-ui-svelte';

    const tabList: PlainTab[] = Array.from({ length: 10 }, (_, i) => ({ itemKey: `Tab-${i}`, tab: `Tab-${i}` }));
    const more: TabsMore = { count: 4, dropdownProps: { trigger: 'click', position: 'bottomRight' } };
</script>

<Tabs {more} style="width: 60%; margin: 20px" {tabList} type="card">
    {#snippet moreTrigger()}
        <Button type="tertiary">Click to show More</Button>
    {/snippet}
    {#snippet panel({ index })}Content of card tab {index}{/snippet}
</Tabs>
