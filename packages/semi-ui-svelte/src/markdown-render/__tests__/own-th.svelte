<script lang="ts">
    import type { Snippet } from 'svelte';

    const { children }: { children?: Snippet } = $props();
</script>

<th data-testid="own-th">{@render children?.()}</th>
