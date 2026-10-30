<script lang="ts">
    import type { Snippet } from 'svelte';

    let { children }: { children?: Snippet } = $props();
</script>

<h1 data-testid="own-svelte">{@render children?.()}</h1>
