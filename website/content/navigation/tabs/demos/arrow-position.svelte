<script lang="ts">
    import { Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    const positions = ['start', 'both', 'end'] as const;
    const tabList: PlainTab[] = Array.from({ length: 10 }, (_, i) => ({ itemKey: `Tab-${i}`, tab: `Tab-${i}` }));
</script>

{#each positions as position (position)}
    <Tabs arrowPosition={position} collapsible style="width: 60%; margin: 20px" {tabList} type="card">
        {#snippet panel({ index })}Content of card tab {index}{/snippet}
    </Tabs>
{/each}
