<script lang="ts">
    import HotKeys from '../hot-keys.svelte';
    import type { HotKeysProps } from '../interface';

    let { store, withChildren = false }: { store: HotKeysProps; withChildren?: boolean } = $props();
</script>

{#if withChildren}
    <HotKeys {...store}>
        <b class="hint">Press K</b>
    </HotKeys>
{:else}
    <HotKeys {...store} />
{/if}
