<script lang="ts">
    import { omitBy } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
    import { IconSendMsgStroked } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import MarkdownRender from '@fibrae/semi-ui-svelte/markdown-render/markdown-render.svelte';
    import contentClass from './content-class.js';
    import { getAIChatDialogueContext } from './context.js';
    import Code from './widgets/content-item/code.svelte';

    let { text, message }: { text: string; message: Message } = $props();

    const { view, referenceClick } = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const isUser = $derived(message.role === strings.ROLE.USER);
    const markdownRenderProps = $derived(view.markdownRenderProps);

    // an explicit undefined entry would replace the built-in component with a non-component
    const components = $derived({ code: Code, ...omitBy(markdownRenderProps?.components ?? {}, (component) => component === undefined) });
    const raw = $derived(view.escapeHtml && isUser ? escapeHtmlInMarkdown(text) : text);
</script>

<div class={contentClass(message, view.mode)}>
    <MarkdownRender format="md" {...markdownRenderProps} {components} {raw} />
    {#if isUser && view.showReference}
        <button aria-label={locale().locale.reference} class="{PREFIX_CONTENT}-icon-reference" type="button" onclick={() => referenceClick({ type: 'text', content: text })}>
            <IconSendMsgStroked />
        </button>
    {/if}
</div>
