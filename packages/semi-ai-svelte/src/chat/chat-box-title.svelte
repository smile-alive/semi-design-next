<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { getChatContext } from './context.js';
    import type { ChatMessage, ChatMetadata } from './interface.js';

    let { message, role }: { message: ChatMessage; role: ChatMetadata } = $props();

    const { snippets } = getChatContext();

    const titleClass = `${cssClasses.PREFIX_CHAT_BOX}-title`;
</script>

{#snippet defaultTitle()}
    <span class={titleClass}>{role.name}</span>
{/snippet}

{#if snippets.title}
    {@render snippets.title({ defaultTitle, message, role })}
{:else}
    {@render defaultTitle()}
{/if}
