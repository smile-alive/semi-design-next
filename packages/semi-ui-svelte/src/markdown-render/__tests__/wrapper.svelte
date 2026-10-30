<script lang="ts">
    import type { Snippet } from 'svelte';

    let { children }: { children?: Snippet; components?: unknown } = $props();
</script>

<section class="wrap">{@render children?.()}</section>
