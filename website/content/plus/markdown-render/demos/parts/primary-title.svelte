<script lang="ts">
    import type { Snippet } from 'svelte';
    import { Typography } from '@fibrae/semi-ui-svelte';

    const { children }: { children?: Snippet } = $props();
</script>

<Typography.Title heading={2} style="color: var(--semi-color-primary)">{@render children?.()}</Typography.Title>
