<script lang="ts">
    import type { Snippet } from 'svelte';
    import ChatBoxActionFoundation, { type ChatBoxActionAdapter, type ChatBoxActionKey, type ChatBoxActionState, getChatBoxActionFlags, getChatBoxActionKeys } from '@fibrae/semi-ai-foundation/components/chat/chat-box-action-foundation';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import { useFoundation } from '@fibrae/semi-ui-svelte/base';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { getChatContext } from '../context.js';
    import type { ChatDefaultActionNodeObj, ChatMessage } from '../interface.js';
    import ActionButton from './action-button.svelte';
    import DeleteAction from './delete-action.svelte';

    interface ChatBoxActionProps {
        message: ChatMessage;
        isLast: boolean;
    }

    type Foundation = ChatBoxActionFoundation<ChatBoxActionProps>;
    type Adapter = ChatBoxActionAdapter<ChatBoxActionProps>;

    let { message, isLast }: ChatBoxActionProps = $props();

    const context = getChatContext();
    const locale = useLocale('Chat');

    const { foundation, states } = useFoundation<Foundation, Adapter, ChatBoxActionProps, ChatBoxActionState>(
        ChatBoxActionFoundation,
        {
            get message() {
                return message;
            },
            get isLast() {
                return isLast;
            },
        },
        () => ChatBoxActionFoundation.getInitialState(),
        () => ({
            notifyDeleteMessage: () => context.deleteMessage(message),
            notifyMessageCopy: () => context.copyMessage(message),
            // the toast renders in the chat, but its text is read once: a locale change while it shows is not followed
            toastCopySuccess: () => context.toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => context.likeMessage(message),
            notifyDislikeMessage: () => context.dislikeMessage(message),
            notifyResetMessage: () => context.resetMessage(message),
        })
    );

    const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
    const flags = $derived(getChatBoxActionFlags({ role: message.role, status: message.status, isLast }));
    const keys = $derived(getChatBoxActionKeys(flags));
    const wrapClass = $derived([PREFIX_CHAT_BOX_ACTION, ChatBoxActionFoundation.isActionBarShown({ showReset: flags.showReset, finished: flags.finished, showAction: states().showAction }) && `${PREFIX_CHAT_BOX_ACTION}-show`, !flags.finished && `${PREFIX_CHAT_BOX_ACTION}-hidden`]);

    // read lazily: the snippets below are declared after the script runs
    const actionNodes: Record<ChatBoxActionKey, Snippet> = $derived({ copyNode, likeNode, dislikeNode, resetNode, deleteNode });
    const defaultActionsObj: ChatDefaultActionNodeObj = $derived(Object.fromEntries(keys.map((key) => [key, actionNodes[key]])));
</script>

{#snippet copyNode()}
    <ActionButton active={false} name="copy" onClick={foundation.copyMessage} />
{/snippet}

{#snippet likeNode()}
    <ActionButton active={Boolean(message.like)} name="like" onClick={foundation.likeMessage} />
{/snippet}

{#snippet dislikeNode()}
    <ActionButton active={Boolean(message.dislike)} name="dislike" onClick={foundation.dislikeMessage} />
{/snippet}

{#snippet resetNode()}
    <ActionButton active={false} name="reset" onClick={foundation.resetMessage} />
{/snippet}

{#snippet deleteNode()}
    <DeleteAction onConfirm={foundation.deleteMessage} onHide={foundation.closeMenu} onShow={foundation.openMenu} visible={states().visible} />
{/snippet}

{#if context.snippets.action}
    {@render context.snippets.action({ class: wrapClass.filter(Boolean).join(' '), defaultActions: Object.values(defaultActionsObj), defaultActionsObj, message })}
{:else}
    <div class={wrapClass}>
        {#each keys as key (key)}
            {@render actionNodes[key]()}
        {/each}
    </div>
{/if}
