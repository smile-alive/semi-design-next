<script lang="ts">
    import BackTop from '../backtop.svelte';

    let scroller = $state<HTMLElement>();
    let clicks = $state(0);
</script>

<div bind:this={scroller} data-testid="scroller" style="height: 200px; overflow: auto">
    <div style="height: 2000px"></div>
</div>
<BackTop aria-label="Back to top" duration={100} target={() => scroller ?? null} onclick={() => clicks++} />
<output aria-label="clicks">{clicks}</output>
