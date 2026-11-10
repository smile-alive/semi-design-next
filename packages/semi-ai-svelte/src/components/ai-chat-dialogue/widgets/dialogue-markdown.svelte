<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import DialogueFoundation, { type Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
    import { IconSendMsgStroked } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import MarkdownRender from '@fibrae/semi-ui-svelte/markdown-render/markdown-render.svelte';
    import { getAIChatDialogueContext } from '../context.js';
    import Code from './content-item/code.svelte';

    let { text, message }: { text: string; message: Message } = $props();

    const { view, referenceClick } = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const isUser = $derived(message.role === strings.ROLE.USER);
    const markdownRenderProps = $derived(view.markdownRenderProps);
    const components = $derived(DialogueFoundation.mergeMarkdownComponents({ code: Code }, markdownRenderProps?.components));
    const raw = $derived(DialogueFoundation.getMarkdownRaw(text, message.role, view.escapeHtml));
</script>

<div class={DialogueFoundation.getContentClass(message.role, message.status, view.mode)}>
    <MarkdownRender format="md" {...markdownRenderProps} {components} {raw} />
    {#if isUser && view.showReference}
        <button aria-label={locale().locale.reference} class="{PREFIX_CONTENT}-icon-reference" type="button" onclick={() => referenceClick({ type: 'text', content: text })}>
            <IconSendMsgStroked />
        </button>
    {/if}
</div>
