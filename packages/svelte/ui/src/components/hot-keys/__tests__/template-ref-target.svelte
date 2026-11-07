<script lang="ts">
    import HotKeys from '../hot-keys.svelte';

    let input: HTMLInputElement | undefined;
    let count = $state(0);
</script>

<div>
    <input aria-label="target" bind:this={input} />
    <HotKeys getListenerTarget={() => input} hotKeys={['k']} onHotKey={() => count++} />
    <span data-testid="count">{count}</span>
</div>
