<script lang="ts">
    import type { TagProps } from '../interface';
    import Tag from '../tag.svelte';

    // the icon snippets are passed only when switched on, so absence stays observable
    let { store }: { store: { props: TagProps; label?: string; node?: boolean; icons?: boolean } } = $props();
</script>

{#snippet prefixIcon()}<b>prefix</b>{/snippet}
{#snippet suffixIcon()}<b>suffix</b>{/snippet}

<Tag {...store.props} prefixIcon={store.icons ? prefixIcon : undefined} suffixIcon={store.icons ? suffixIcon : undefined}>
    {#if store.node}
        <span>{store.label ?? 'semi'}</span>
    {:else}
        {store.label ?? 'semi'}
    {/if}
</Tag>
