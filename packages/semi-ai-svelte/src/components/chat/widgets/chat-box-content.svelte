<script lang="ts">
    import ChatFoundation from '@fibrae/semi-ai-foundation/components/chat/foundation';
    import { getChatContext } from '../context.js';
    import type { ChatMessage, ChatMetadata } from '../interface.js';
    import ChatBoxBody from './chat-box-body.svelte';

    let { message, role }: { message: ChatMessage; role: ChatMetadata } = $props();

    const { view, snippets } = getChatContext();

    const wrapClass = $derived(ChatFoundation.getContentClass(message.role, message.status, view.mode));
</script>

{#snippet defaultContent()}
    <ChatBoxBody {message} />
{/snippet}

{#if snippets.content}
    {@render snippets.content({ class: wrapClass, defaultContent, message, role })}
{:else}
    <div class={wrapClass}>{@render defaultContent()}</div>
{/if}
