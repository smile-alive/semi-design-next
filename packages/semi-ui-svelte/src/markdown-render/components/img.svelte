<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import { IconUploadError } from '@fibrae/semi-icons-svelte';
    import { Image, type ImageProps } from '../../image/index.js';
    import { getMarkdownLinkContext } from '../context.js';
    import type { MarkdownRenderElementProps } from '../interface.js';

    const { node: _node, ...rest }: ImageProps & Pick<MarkdownRenderElementProps, 'node'> = $props();

    const inLink = getMarkdownLinkContext();
</script>

{#snippet uploadError()}
    <IconUploadError />
{/snippet}

<div class={`${cssClasses.PREFIX}-component-image`}>
    <!-- in a link the link is the only control, unless the caller asks for a preview -->
    <Image fallback={uploadError} preview={inLink ? false : undefined} width="100%" {...rest} />
    <!-- the alt already names the image -->
    <div aria-hidden="true" class={`${cssClasses.PREFIX}-component-image-alt`}>{rest.alt}</div>
</div>
