<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import { TypographyParagraph, type TypographyParagraphProps } from '../../typography/index.js';
    import type { MarkdownRenderElementProps } from '../interface.js';
    import { containsImage } from './tree.js';

    const { children, node, class: className, ...rest }: TypographyParagraphProps & MarkdownRenderElementProps = $props();

    // a div, since the image component renders one
    const component = $derived(node && containsImage(node.props.children) ? 'div' : undefined);
</script>

<TypographyParagraph {component} {...rest} class={[`${cssClasses.PREFIX}-component-p`, className]}>{@render children?.()}</TypographyParagraph>
