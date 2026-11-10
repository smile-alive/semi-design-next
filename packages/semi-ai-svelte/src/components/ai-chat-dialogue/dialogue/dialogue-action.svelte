<script lang="ts">
    import type { Snippet } from 'svelte';
    import DialogueActionFoundation, { type DialogueActionAdapter, type DialogueActionBaseProps, type DialogueActionKey, type DialogueActionState, getDialogueActionFlags, getDialogueActionKeys } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/action-foundation';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils';
    import { useFoundation } from '@fibrae/semi-ui-svelte/base';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { Modal } from '@fibrae/semi-ui-svelte/modal/index';
    import { Toast } from '@fibrae/semi-ui-svelte/toast/index';
    import { getAIChatDialogueContext } from '../context.js';
    import type { DefaultActionNodeObj } from '../interface.js';
    import DialogueActionButton from './dialogue-action-button.svelte';
    import DialogueActionMore from './dialogue-action-more.svelte';

    type Foundation = DialogueActionFoundation<DialogueActionBaseProps>;
    type Adapter = DialogueActionAdapter<DialogueActionBaseProps>;

    let { message, isLastChat }: { message: Message; isLastChat: boolean } = $props();

    const context = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { foundation, states } = useFoundation<Foundation, Adapter, DialogueActionBaseProps, DialogueActionState>(
        DialogueActionFoundation,
        {
            get message() {
                return message;
            },
        },
        () => DialogueActionFoundation.getInitialState(),
        () => ({
            notifyMessageCopy: () => context.messageCopy(message),
            toastCopySuccess: () => Toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => context.messageGoodFeedback(message),
            notifyDislikeMessage: () => context.messageBadFeedback(message),
            notifyResetMessage: () => context.messageReset(message),
            notifyShareMessage: () => context.messageShare(message),
            notifyEditMessage: () => context.messageEdit(message),
            notifyDeleteMessage: () => context.messageDelete(message),
        })
    );

    const { PREFIX, PREFIX_ACTION } = cssClasses;
    const flags = $derived(getDialogueActionFlags({ role: message.role, status: message.status, isLastChat, showReset: context.view.showReset }));
    const wrapCls = $derived([PREFIX_ACTION, DialogueActionFoundation.isActionBarShown({ showReset: flags.showReset, finished: flags.finished, showAction: states().showAction }) && `${PREFIX_ACTION}-show`, !flags.finished && `${PREFIX_ACTION}-hidden`].filter(Boolean).join(' '));
    const barKeys = $derived(getDialogueActionKeys(flags, false));

    // read lazily: the snippets below are declared after the script runs
    const actionNodes: Record<DialogueActionKey, Snippet> = $derived({ copyNode, likeNode, dislikeNode, resetNode, shareNode, editNode, moreNode });
    const defaultActionsObj: DefaultActionNodeObj = $derived(Object.fromEntries(getDialogueActionKeys(flags, true).map((key) => [key, actionNodes[key]])));

    // the warning renders outside this tree, so its text is read here to follow the LocaleProvider
    const showDeleteModal = (trigger?: HTMLElement) => {
        const list = trigger?.closest<HTMLElement>(`.${PREFIX}-list`);
        Modal.warning({
            title: locale().locale.deleteConfirm,
            content: locale().locale.deleteContent,
            onOk: foundation.deleteMessage,
            // the deleted message took the more button along; the list takes the focus the modal gives up
            afterClose: () => trigger && handoverFocus(trigger, list),
        });
        foundation.closeMenu();
    };
</script>

{#snippet copyNode()}
    <DialogueActionButton kind="copy" onClick={foundation.copyMessage} />
{/snippet}

{#snippet likeNode()}
    <DialogueActionButton active={message.like} kind="like" onClick={foundation.likeMessage} />
{/snippet}

{#snippet dislikeNode()}
    <DialogueActionButton active={message.dislike} kind="dislike" onClick={foundation.dislikeMessage} />
{/snippet}

{#snippet resetNode()}
    <DialogueActionButton kind="reset" onClick={foundation.resetMessage} />
{/snippet}

{#snippet shareNode()}
    <DialogueActionButton kind="share" onClick={foundation.shareMessage} />
{/snippet}

{#snippet editNode()}
    <DialogueActionButton kind="edit" onClick={foundation.editMessage} />
{/snippet}

{#snippet moreNode()}
    <DialogueActionMore onDelete={showDeleteModal} onHide={foundation.closeMenu} onShow={foundation.openMenu} visible={states().visible} />
{/snippet}

{#if context.snippets.action}
    {@render context.snippets.action({ class: wrapCls, defaultActions: Object.values(defaultActionsObj), defaultActionsObj, message })}
{:else}
    <div class={wrapCls}>
        {#each barKeys as key (key)}
            {@render actionNodes[key]()}
        {/each}
    </div>
{/if}
