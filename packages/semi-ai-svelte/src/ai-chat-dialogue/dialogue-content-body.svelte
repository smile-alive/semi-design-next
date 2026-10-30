<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { messageToChatInput } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getMessageText } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-text';
    import { IconAlertCircle } from '@fibrae/semi-icons-svelte';
    import { getAIChatDialogueContext } from './context.js';
    import DialogueContentItem from './dialogue-content-item.svelte';
    import DialogueMarkdown from './dialogue-markdown.svelte';

    let { message, editing }: { message: Message; editing: boolean } = $props();

    const { snippets } = getAIChatDialogueContext();

    const { PREFIX_CONTENT } = cssClasses;
    const { STATUS } = strings;
    const textContent = $derived(Array.isArray(message.content) ? undefined : getMessageText(message));
    const items = $derived(Array.isArray(message.content) ? message.content : []);
    const failed = $derived(message.status === STATUS.FAILED || message.status === STATUS.CANCELLED);
</script>

{#if editing}
    {@render snippets.messageEdit?.(messageToChatInput(message))}
{:else}
    <div class="{PREFIX_CONTENT}-wrapper">
        {#if failed}
            <div class="{PREFIX_CONTENT}-failed"><IconAlertCircle /></div>
        {/if}
        <div class="{PREFIX_CONTENT}-inner">
            {#if textContent}
                {#if snippets.messageText}
                    <div class="{PREFIX_CONTENT}-custom-renderer" x-semi-prop="messageText">
                        {@render snippets.messageText({ message, text: textContent })}
                    </div>
                {:else}
                    <DialogueMarkdown {message} text={textContent} />
                {/if}
            {/if}
            {#each items as item, index (index)}
                <DialogueContentItem {index} {item} {message} />
            {/each}
        </div>
    </div>
{/if}
