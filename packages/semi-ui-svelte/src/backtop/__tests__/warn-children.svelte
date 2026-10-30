<script lang="ts">
    import BackTop from '../backtop.svelte';

    let { store }: { store: { kind: 'plain' | 'link' | 'switch' } } = $props();
</script>

{#snippet children()}
    {#if store.kind === 'plain'}
        <span>UP</span>
    {:else if store.kind === 'link'}
        <a href="#top">UP</a>
    {:else}
        <span aria-checked="false" role="switch">UP</span>
    {/if}
{/snippet}

<BackTop {children} visibilityHeight={-1} />
