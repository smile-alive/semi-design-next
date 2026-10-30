<script lang="ts">
    import type { Snippet } from 'svelte';
    import ChatBoxActionFoundation, { type ChatBoxActionAdapter } from '@fibrae/semi-ai-foundation/chat/chat-box-action-foundation';
    import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import ActionButton from './action-button.svelte';
    import { getChatContext } from './context.js';
    import DeleteAction from './delete-action.svelte';
    import type { ChatDefaultActionNodeObj, ChatMessage } from './interface.js';

    interface ChatBoxActionProps {
        message: ChatMessage;
        isLast: boolean;
    }

    interface ChatBoxActionState {
        visible: boolean;
        showAction: boolean;
    }

    type ActionName = 'copy' | 'like' | 'dislike' | 'reset' | 'delete';
    type Foundation = ChatBoxActionFoundation<ChatBoxActionProps, ChatBoxActionState>;
    type Adapter = ChatBoxActionAdapter<ChatBoxActionProps, ChatBoxActionState>;

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
        () => ({ visible: false, showAction: false }),
        (base) => ({
            notifyDeleteMessage: () => context.deleteMessage(message),
            notifyMessageCopy: () => context.copyMessage(message),
            // the toast renders in the chat, but its text is read once: a locale change while it shows is not followed
            toastCopySuccess: () => context.toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => context.likeMessage(message),
            notifyDislikeMessage: () => context.dislikeMessage(message),
            notifyResetMessage: () => context.resetMessage(message),
            setVisible: (visible) => base.setState({ visible }),
            setShowAction: (showAction) => base.setState({ showAction }),
        })
    );

    const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
    const { ROLE, MESSAGE_STATUS } = strings;
    const status = $derived(message.status ?? MESSAGE_STATUS.COMPLETE);

    const actions = $derived.by(() => {
        const complete = status === MESSAGE_STATUS.COMPLETE;
        const names: ActionName[] = [];
        if (complete) {
            names.push('copy');
        }
        if (complete && message.role !== ROLE.USER) {
            names.push('like', 'dislike');
        }
        if (isLast && message.role === ROLE.ASSISTANT) {
            names.push('reset');
        }
        names.push('delete');
        return names;
    });

    const wrapClass = $derived.by(() => {
        const finished = !isUnfinishedMessageStatus(status);
        return [PREFIX_CHAT_BOX_ACTION, ((actions.includes('reset') && finished) || states().showAction) && `${PREFIX_CHAT_BOX_ACTION}-show`, !finished && `${PREFIX_CHAT_BOX_ACTION}-hidden`];
    });

    // a function, as the snippets below are declared after the script runs
    const nodeOf = (name: ActionName): Snippet => ({ copy: copyNode, like: likeNode, dislike: dislikeNode, reset: resetNode, delete: deleteNode })[name];

    const defaultActionsObj = $derived(Object.fromEntries(actions.map((name) => [`${name}Node`, nodeOf(name)])) as ChatDefaultActionNodeObj);
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
    <DeleteAction onConfirm={foundation.deleteMessage} onHide={foundation.hideDeletePopup} onShow={foundation.showDeletePopup} visible={states().visible} />
{/snippet}

{#if context.snippets.action}
    {@render context.snippets.action({ class: wrapClass.filter(Boolean).join(' '), defaultActions: Object.values(defaultActionsObj), defaultActionsObj, message })}
{:else}
    <div class={wrapClass}>
        {#each actions as name (name)}
            {@render nodeOf(name)()}
        {/each}
    </div>
{/if}
