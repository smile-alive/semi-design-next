<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import { TypographyTitle, type TypographyTitleProps } from '../../typography/index.js';
    import type { MarkdownRenderElementProps } from '../interface.js';

    // attributes such as rehype-slug ids fall through to the title
    const { children, node: _node, level, class: className, ...rest }: TypographyTitleProps & MarkdownRenderElementProps & { level: NonNullable<TypographyTitleProps['heading']> } = $props();
</script>

<TypographyTitle {...rest} class={[`${cssClasses.PREFIX}-component-header`, className]} heading={level}>{@render children?.()}</TypographyTitle>
