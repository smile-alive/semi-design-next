<script lang="ts">
    import { Popover } from '../../popover';
    import type { TransferDataItem } from '../interface';
    import Transfer from '../transfer.svelte';

    // 'popover' puts a draggable Transfer in a click Popover; 'pair' sets a roomy and a narrow Transfer side by side
    let { kind, dataSource }: { kind: 'popover' | 'pair'; dataSource: TransferDataItem[] } = $props();
</script>

{#snippet content()}
    <Transfer {dataSource} draggable style="width: 400px; height: 300px" value={[2, 4]} />
{/snippet}

{#if kind === 'popover'}
    <!-- Without motion: items measured mid-transition are offset from the drag overlay dnd-kit places at pick-up -->
    <Popover aria-label="Transfer panel" {content} motion={false} position="bottomLeft" trigger="click">
        {#snippet child({ props })}
            <button {...props} type="button">Transfer In Popover</button>
        {/snippet}
    </Popover>
{:else}
    <Transfer {dataSource} style="width: 600px" />
    <Transfer {dataSource} style="min-width: 0; width: 260px" />
{/if}
