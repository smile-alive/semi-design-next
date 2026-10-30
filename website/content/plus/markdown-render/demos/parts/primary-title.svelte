<script lang="ts">
    import type { Snippet } from 'svelte';
    import { TypographyTitle } from '@fibrae/semi-ui-svelte';

    const { children }: { children?: Snippet } = $props();
</script>

<TypographyTitle heading={2} style="color: var(--semi-color-primary)">{@render children?.()}</TypographyTitle>
