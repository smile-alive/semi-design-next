<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import ChatBoxAction from './chat-box-action.svelte';
    import ChatBoxAvatar from './chat-box-avatar.svelte';
    import ChatBoxContent from './chat-box-content.svelte';
    import ChatBoxTitle from './chat-box-title.svelte';
    import { getChatContext } from './context.js';
    import type { ChatMessage, ChatMetadata } from './interface.js';

    let { message, continueSend, isLast }: { message: ChatMessage; continueSend: boolean; isLast: boolean } = $props();

    const { view, snippets } = getChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
    const { ROLE, CHAT_ALIGN } = strings;
    const role = $derived<ChatMetadata>(view.roleConfig?.[message.role ?? ''] ?? {});
    const boxClass = $derived([PREFIX_CHAT_BOX, message.role === ROLE.USER && view.align === CHAT_ALIGN.LEFT_RIGHT && `${PREFIX_CHAT_BOX}-right`].filter(Boolean).join(' '));
</script>

{#snippet avatarNode()}
    <ChatBoxAvatar {continueSend} {message} {role} />
{/snippet}

{#snippet titleNode()}
    <ChatBoxTitle {message} {role} />
{/snippet}

{#snippet contentNode()}
    <ChatBoxContent {message} {role} />
{/snippet}

{#snippet actionNode()}
    <ChatBoxAction {isLast} {message} />
{/snippet}

{#if snippets.fullChatBox}
    {@render snippets.fullChatBox({ class: boxClass, defaultNodes: { avatar: avatarNode, title: titleNode, content: contentNode, action: actionNode }, message, role })}
{:else}
    <div class={boxClass}>
        {@render avatarNode()}
        <div class="{PREFIX_CHAT_BOX}-wrap">
            {#if !continueSend}
                {@render titleNode()}
            {/if}
            {@render contentNode()}
            {@render actionNode()}
        </div>
    </div>
{/if}
