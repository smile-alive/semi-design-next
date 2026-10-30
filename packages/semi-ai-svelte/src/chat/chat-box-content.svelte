<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import ChatFoundation from '@fibrae/semi-ai-foundation/chat/foundation';
    import ChatBoxBody from './chat-box-body.svelte';
    import { getChatContext } from './context.js';
    import type { ChatMessage, ChatMetadata } from './interface.js';

    let { message, role }: { message: ChatMessage; role: ChatMetadata } = $props();

    const { view, snippets } = getChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;

    const wrapClass = $derived.by(() => {
        const { mode } = view;
        const { bubble, user, error } = ChatFoundation.getContentFlags(message.role, message.status, mode);
        return [`${PREFIX_CHAT_BOX}-content`, bubble && `${PREFIX_CHAT_BOX}-content-${mode}`, user && `${PREFIX_CHAT_BOX}-content-user`, error && `${PREFIX_CHAT_BOX}-content-error`].filter(Boolean).join(' ');
    });
</script>

{#snippet defaultContent()}
    <ChatBoxBody {message} />
{/snippet}

{#if snippets.content}
    {@render snippets.content({ class: wrapClass, defaultContent, message, role })}
{:else}
    <div class={wrapClass}>{@render defaultContent()}</div>
{/if}
