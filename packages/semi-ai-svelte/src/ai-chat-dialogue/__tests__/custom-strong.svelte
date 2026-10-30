<script lang="ts">
    import type { Snippet } from 'svelte';

    let { children }: { children?: Snippet } = $props();
</script>

<b data-testid="custom-strong">{@render children?.()}</b>
