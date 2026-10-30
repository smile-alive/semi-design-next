<script lang="ts">
    import observeResize from '../observe-resize';

    let { store }: { store: { show: boolean; onResize: (entries: ResizeObserverEntry[]) => void } } = $props();
</script>

{#if store.show}
    <div {@attach observeResize(store.onResize)} data-testid="box"></div>
{/if}
