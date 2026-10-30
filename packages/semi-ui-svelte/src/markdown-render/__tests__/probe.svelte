<script lang="ts">
    import type { Snippet } from 'svelte';

    let { children, class: className, onClick }: { children?: Snippet; class?: string; onClick?: (event: MouseEvent) => void } = $props();
</script>

<button class={['probe-root', className]} type="button" onclick={onClick}>{@render children?.()}</button>
