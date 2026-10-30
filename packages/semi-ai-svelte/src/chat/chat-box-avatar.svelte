<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import Avatar from '@fibrae/semi-ui-svelte/avatar/avatar.svelte';
    import { getChatContext } from './context.js';
    import type { ChatMessage, ChatMetadata } from './interface.js';

    let { message, role, continueSend }: { message: ChatMessage; role: ChatMetadata; continueSend: boolean } = $props();

    const { snippets } = getChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
</script>

{#snippet roleNode()}
    {@render snippets.roleAvatar?.({ role, message })}
{/snippet}

{#snippet defaultAvatar()}
    <!-- the title next to it names the sender -->
    <Avatar alt="" children={snippets.roleAvatar ? roleNode : undefined} class={[`${PREFIX_CHAT_BOX}-avatar`, { [`${PREFIX_CHAT_BOX}-avatar-hidden`]: continueSend }]} color={role.color} size="extra-small" src={role.avatar} />
{/snippet}

{#if snippets.avatar}
    {@render snippets.avatar({ defaultAvatar, message, role })}
{:else}
    {@render defaultAvatar()}
{/if}
