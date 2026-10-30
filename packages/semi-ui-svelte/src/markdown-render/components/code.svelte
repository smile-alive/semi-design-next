<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import { CodeHighlight } from '../../code-highlight/index.js';
    import codeText from '../code-text.js';
    import type { MarkdownRenderElementProps } from '../interface.js';
    import { isPlainText } from './tree.js';

    // only the class (the fence language) carries meaning
    const { children, node, class: className }: { class?: string } & MarkdownRenderElementProps = $props();

    const language = $derived(MarkdownRenderFoundation.getCodeLanguage(className));

    // the children snippet hides the source, so highlighting needs the node
    const source = $derived(language && node && isPlainText(node.props.children) ? codeText(node.props.children) : undefined);
</script>

{#if language && source !== undefined}
    <CodeHighlight code={source} {language} lineNumber />
{:else if language}
    <code class={className}>{@render children?.()}</code>
{:else}
    <code class={`${cssClasses.PREFIX}-simple-code`}>{@render children?.()}</code>
{/if}
