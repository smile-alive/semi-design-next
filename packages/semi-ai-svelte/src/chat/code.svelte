<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-svelte';
    import { useCopied, useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import MarkdownCode from '@fibrae/semi-ui-svelte/markdown-render/components/code.svelte';
    import { codeText, type MarkdownRenderElementProps } from '@fibrae/semi-ui-svelte/markdown-render/index';

    // only the class (the fence language) carries meaning
    const { class: className, node, children }: { class?: string } & MarkdownRenderElementProps = $props();

    const locale = useLocale('Chat');

    const copier = useCopied(() => 2000);

    const { PREFIX_CHAT_BOX } = cssClasses;
    const bar = `${PREFIX_CHAT_BOX}-content-code-topSlot`;
    const language = $derived(MarkdownRenderFoundation.getCodeLanguage(className));
    const source = $derived(node ? codeText(node.props.children) : '');

    const onCopy = () => {
        if (!copier.copied) {
            void copier.copy(source);
        }
    };
</script>

{#if language}
    <!-- The bar and the code touch: whitespace between them would become a line of its own -->
    <div class="{PREFIX_CHAT_BOX}-content-code {BASE_CLASS_PREFIX}-always-dark">
        <div class={bar}>
            <span class="{bar}-type">{language}</span>
            <span class="{bar}-copy">
                <!-- one element for both states, so focus survives the swap -->
                <button class={[`${bar}-copy-wrapper`, { [`${bar}-toCopy`]: !copier.copied }]} type="button" onclick={onCopy}>
                    {#if copier.copied}
                        <IconTick />
                    {:else}
                        <IconCopyStroked />
                    {/if}
                    {copier.copied ? locale().locale.copied : locale().locale.copy}
                </button>
            </span>
        </div>
        <MarkdownCode {children} class={className} {node} />
    </div>
{:else}
    <MarkdownCode {children} class={className} {node} />
{/if}
