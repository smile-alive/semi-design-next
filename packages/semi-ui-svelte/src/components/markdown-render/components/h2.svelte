<script lang="ts">
    import type { TypographyTitleProps } from '../../typography/index.js';
    import type { MarkdownRenderElementProps } from '../interface.js';
    import Heading from './heading.svelte';

    const props: TypographyTitleProps & MarkdownRenderElementProps = $props();
</script>

<Heading {...props} level={2} />
