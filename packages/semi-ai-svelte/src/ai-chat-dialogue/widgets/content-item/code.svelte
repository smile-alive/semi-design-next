<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-svelte';
    import { useCopied, useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import MarkdownCode from '@fibrae/semi-ui-svelte/markdown-render/components/code.svelte';
    import { codeText, type MarkdownRenderElementProps } from '@fibrae/semi-ui-svelte/markdown-render/index';

    // only the class (the fence language) carries meaning
    const { class: className, node, children }: { class?: string } & MarkdownRenderElementProps = $props();

    const locale = useLocale('AIChatDialogue');

    const copied = useCopied(() => 2000);

    const { PREFIX_CODE } = cssClasses;
    const language = $derived(MarkdownRenderFoundation.getCodeLanguage(className));
    const source = $derived(node ? codeText(node.props.children) : '');
</script>

{#if language}
    <!-- The bar and the code touch: whitespace between them would become a line of its own -->
    <div class={PREFIX_CODE}>
        <div class="{PREFIX_CODE}-topSlot">
            <span class="{PREFIX_CODE}-topSlot-type">{language}</span>
            <span class="{PREFIX_CODE}-topSlot-copy">
                <!-- one element for both states, so focus survives the swap -->
                <button aria-label={copied.copied ? locale().locale.copySuccess : locale().locale.copy} class="{PREFIX_CODE}-topSlot-copy-wrapper" type="button" onclick={() => (copied.copied ? undefined : void copied.copy(source))}>
                    {#if copied.copied}
                        <IconTick />
                    {:else}
                        <IconCopyStroked />
                    {/if}
                </button>
            </span>
        </div><MarkdownCode {children} class={className} {node} />
    </div>
{:else}
    <MarkdownCode {children} class={className} {node} />
{/if}
