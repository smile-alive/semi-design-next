<script lang="ts">
    import Button from '../button.svelte';
    import SplitButtonGroup from '../split-button-group.svelte';

    let { store }: { store: { labels: string[] } } = $props();
</script>

<SplitButtonGroup aria-label="split">
    {#each store.labels as label (label)}
        <Button>{label}</Button>
    {/each}
</SplitButtonGroup>
