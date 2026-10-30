<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { cssClasses as markdownCssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
    import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-svelte';
    import { useCopied, useLocale } from '@fibrae/semi-ui-svelte/hooks';

    // markdown attributes belong to the code element, which reads the language from class
    let { children, ...rest }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();

    const locale = useLocale('Chat');

    let code: HTMLElement | undefined = $state();

    const copier = useCopied(() => 2000);

    const { PREFIX_CHAT_BOX } = cssClasses;
    const bar = `${PREFIX_CHAT_BOX}-content-code-topSlot`;
    const language = $derived(MarkdownRenderFoundation.getCodeLanguage(typeof rest.class === 'string' ? rest.class : undefined));

    // MarkdownRender hands a component its children as a snippet, so the source text is read from the rendered element
    const onCopy = () => {
        if (!copier.copied) {
            void copier.copy(code?.textContent ?? '');
        }
    };
</script>

{#if language}
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
        <code {...rest} bind:this={code}>{@render children?.()}</code>
    </div>
{:else}
    <code {...rest} class={[`${markdownCssClasses.PREFIX}-simple-code`, rest.class]}>{@render children?.()}</code>
{/if}
