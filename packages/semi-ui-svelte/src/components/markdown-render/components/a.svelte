<script lang="ts">
    import type { HTMLAnchorAttributes } from 'svelte/elements';
    import { TypographyText } from '../../typography/index.js';
    import { setMarkdownLinkContext } from '../context.js';
    import type { MarkdownRenderElementProps } from '../interface.js';

    // attributes belong to the anchor alone; on the Typography root they would be duplicated
    const { children, node: _node, ...link }: HTMLAnchorAttributes & MarkdownRenderElementProps = $props();

    setMarkdownLinkContext(true);
</script>

<TypographyText {link}>{@render children?.()}</TypographyText>
