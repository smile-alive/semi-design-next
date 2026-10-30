<script lang="ts">
    import { codeText, type MarkdownRenderElementProps } from '../index';

    const { class: className, node }: { class?: string } & MarkdownRenderElementProps = $props();
</script>

<code class={className} data-source={node ? codeText(node.props.children) : undefined} data-testid="own-code"></code>
