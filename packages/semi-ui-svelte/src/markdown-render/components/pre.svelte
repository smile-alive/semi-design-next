<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import type { MarkdownRenderElementProps } from '../interface.js';
    import { isHighlightedBlock } from './tree.js';

    const { children, node, ...rest }: HTMLAttributes<HTMLPreElement> & MarkdownRenderElementProps = $props();

    const bare = $derived(node !== undefined && isHighlightedBlock(node.props.children));
</script>

{#if bare}
    {@render children?.()}
{:else}
    <pre {...rest}>{@render children?.()}</pre>
{/if}
