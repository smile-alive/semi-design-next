<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import Avatar from '@fibrae/semi-ui-svelte/avatar/avatar.svelte';
    import { getAIChatDialogueContext } from './context.js';
    import type { Metadata } from './interface.js';

    let { message, role, continueSend = false }: { message: Message; role?: Metadata; continueSend?: boolean } = $props();

    const { snippets } = getAIChatDialogueContext();

    const prefix = cssClasses.PREFIX;
</script>

{#snippet defaultAvatar()}
    <!-- alt names the sender only in a continued run, where the title beside it is not shown -->
    <Avatar alt={continueSend ? (role?.name ?? '') : ''} class={[`${prefix}-avatar`, { [`${prefix}-avatar-hidden`]: continueSend }]} color={role?.color} size="extra-small" src={role?.avatar} />
{/snippet}

{#if snippets.avatar}
    {@render snippets.avatar({ defaultAvatar, message, role })}
{:else}
    {@render defaultAvatar()}
{/if}
