<script lang="ts">
    import type { Snippet } from 'svelte';
    import { Button, type ButtonProps } from '@fibrae/semi-ui-svelte';

    // MarkdownRender passes component elements their props as written, so the MDX `onClick` arrives as `onClick`.
    // Only what the button needs is picked: `node`, the compiled element, must not reach the DOM.
    const { children, onClick }: { children?: Snippet; onClick?: ButtonProps['onclick'] } = $props();
</script>

<Button style="margin-bottom: 12px" type="primary" onclick={onClick}>{@render children?.()}</Button>
