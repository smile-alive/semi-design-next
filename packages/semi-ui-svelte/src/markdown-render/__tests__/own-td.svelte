<script lang="ts">
    import type { Snippet } from 'svelte';

    const { children }: { children?: Snippet } = $props();
</script>

<td data-testid="own-td">{@render children?.()}</td>
