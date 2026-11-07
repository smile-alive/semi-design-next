<script lang="ts">
    import Anchor from '../anchor.svelte';
    import type { Fixture } from './fixture-data';

    let { store }: { store: Fixture } = $props();
</script>

{#snippet nodeTitle({ item }: { item: { title?: string } })}<b>{item.title}</b>{/snippet}

<Anchor {...store.props} title={store.nodeTitles ? nodeTitle : undefined} />
{#if store.extraBoxes}
    <div id="one"></div>
    <div id="two"></div>
{/if}
{#if store.boxId}
    {#if store.showBox}
        <div id={store.boxId}>
            {#each store.sections as id (id)}
                <h2 {id}>{id.toUpperCase()}</h2>
            {/each}
        </div>
    {/if}
{:else}
    {#each store.sections as id (id)}
        <h2 {id}>{id.toUpperCase()}</h2>
    {/each}
{/if}
