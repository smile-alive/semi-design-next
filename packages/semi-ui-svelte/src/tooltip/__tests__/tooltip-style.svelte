<script lang="ts">
    import Tooltip from '../tooltip.svelte';

    let { store }: { store: { style: string } } = $props();
</script>

{#snippet content()}
    <span>content</span>
{/snippet}

<div style="padding: 120px">
    <Tooltip {content} motion={false} style={store.style} trigger="custom" visible>trigger</Tooltip>
</div>
