<script lang="ts">
    import Descriptions from '../descriptions.svelte';
    import type { DescriptionsProps } from '../interface';

    const { store, snippets = false }: { store: DescriptionsProps; snippets?: boolean } = $props();
</script>

{#if snippets}
    <Descriptions {...store}>
        {#snippet itemKey({ item, index })}
            <b class="rich-key">{index + 1}:{item.key}</b>
        {/snippet}
        {#snippet value({ item, index })}
            <i class="rich-value">{item.value}@{index}</i>
        {/snippet}
    </Descriptions>
{:else}
    <Descriptions {...store} />
{/if}
