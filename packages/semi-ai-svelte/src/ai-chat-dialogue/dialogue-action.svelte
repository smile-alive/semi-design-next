<script lang="ts">
    import DialogueActionFoundation, { type DialogueActionAdapter, type DialogueActionBaseProps, getDialogueActionFlags } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/action-foundation';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import useFoundation from '@fibrae/semi-ui-svelte/_base/use-foundation.svelte.js';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { Modal } from '@fibrae/semi-ui-svelte/modal/index';
    import { Toast } from '@fibrae/semi-ui-svelte/toast/index';
    import { getAIChatDialogueContext } from './context.js';
    import DialogueActionButton from './dialogue-action-button.svelte';
    import DialogueActionMore from './dialogue-action-more.svelte';
    import type { DefaultActionNodeObj } from './interface.js';

    interface DialogueActionState {
        visible: boolean;
        showAction: boolean;
    }

    type Foundation = DialogueActionFoundation<DialogueActionBaseProps, DialogueActionState>;
    type Adapter = DialogueActionAdapter<DialogueActionBaseProps, DialogueActionState>;

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
        () => ({ visible: false, showAction: false }),
        (base) => ({
            notifyMessageCopy: () => context.messageCopy(message),
            toastCopySuccess: () => Toast.success({ content: locale().locale.copySuccess }),
            notifyLikeMessage: () => context.messageGoodFeedback(message),
            notifyDislikeMessage: () => context.messageBadFeedback(message),
            notifyResetMessage: () => context.messageReset(message),
            notifyShareMessage: () => context.messageShare(message),
            notifyEditMessage: () => context.messageEdit(message),
            notifyDeleteMessage: () => context.messageDelete(message),
            setVisible: (visible) => base.setState({ visible }),
            setShowAction: (showAction) => base.setState({ showAction }),
        })
    );

    const { PREFIX, PREFIX_ACTION } = cssClasses;
    const flags = $derived(getDialogueActionFlags({ role: message.role, status: message.status, isLastChat, showReset: context.view.showReset }));
    const wrapCls = $derived([PREFIX_ACTION, ((flags.showReset && flags.finished) || states().showAction) && `${PREFIX_ACTION}-show`, !flags.finished && `${PREFIX_ACTION}-hidden`].filter(Boolean).join(' '));

    const defaultActionsObj = $derived.by(() => {
        const nodes: DefaultActionNodeObj = {};
        if (flags.completed) {
            nodes.copyNode = copyNode;
        }
        if (flags.showFeedback) {
            nodes.likeNode = likeNode;
            nodes.dislikeNode = dislikeNode;
        }
        if (flags.showReset) {
            nodes.resetNode = resetNode;
        }
        if (flags.completed) {
            nodes.shareNode = shareNode;
        }
        if (flags.showEdit) {
            nodes.editNode = editNode;
        }
        nodes.moreNode = moreNode;
        return nodes;
    });

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
        foundation.hideMoreDropdown();
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
    <DialogueActionMore onDelete={showDeleteModal} onHide={foundation.hideMoreDropdown} onShow={foundation.showMoreDropdown} visible={states().visible} />
{/snippet}

{#if context.snippets.action}
    {@render context.snippets.action({ class: wrapCls, defaultActions: Object.values(defaultActionsObj), defaultActionsObj, message })}
{:else}
    <!-- the blocks touch: whitespace between them would render as gaps between the buttons, which Vue condenses away -->
    <div class={wrapCls}>
        {#if flags.completed}{@render copyNode()}{/if}{#if flags.showReset}{@render resetNode()}{/if}{#if flags.completed}{@render shareNode()}{/if}{#if flags.showEdit}{@render editNode()}{/if}{#if flags.showFeedback}{@render likeNode()}{@render dislikeNode()}{/if}{@render moreNode()}
    </div>
{/if}
