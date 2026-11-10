<script setup lang="ts">
    import { type VNode, computed, h, normalizeClass } from 'vue';
    import DialogueActionFoundation, { type DialogueActionAdapter, type DialogueActionKey, type DialogueActionState, getDialogueActionFlags, getDialogueActionKeys } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/action-foundation';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import useFoundation from '@fibrae/semi-ui-vue/base/use-foundation';
    import { useLocale } from '@fibrae/semi-ui-vue/composables';
    import Modal from '@fibrae/semi-ui-vue/modal/index';
    import Toast from '@fibrae/semi-ui-vue/toast/index';
    import { useAIChatDialogueContext } from '../context';
    import type { AIChatDialogueSlots, DefaultActionNodeObj } from '../interface';
    import DialogueActionButton from './dialogue-action-button.vue';
    import DialogueActionMore from './dialogue-action-more.vue';

    interface DialogueActionProps {
        message: Message;
        isLastChat: boolean;
    }

    type ActionKind = InstanceType<typeof DialogueActionButton>['$props']['kind'];
    type Foundation = DialogueActionFoundation<DialogueActionProps>;
    type Adapter = DialogueActionAdapter<DialogueActionProps>;

    const props = defineProps<DialogueActionProps>();
    defineSlots<Pick<AIChatDialogueSlots, 'action'>>();

    const context = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { foundation, state } = useFoundation<Foundation, Adapter, DialogueActionProps, DialogueActionState>(
        DialogueActionFoundation,
        props,
        () => DialogueActionFoundation.getInitialState(),
        () => ({
            notifyMessageCopy: () => context.messageCopy(props.message),
            toastCopySuccess: () => Toast.success({ content: locale.value.locale.copySuccess }),
            notifyLikeMessage: () => context.messageGoodFeedback(props.message),
            notifyDislikeMessage: () => context.messageBadFeedback(props.message),
            notifyResetMessage: () => context.messageReset(props.message),
            notifyShareMessage: () => context.messageShare(props.message),
            notifyEditMessage: () => context.messageEdit(props.message),
            notifyDeleteMessage: () => context.messageDelete(props.message),
        })
    );

    const { PREFIX, PREFIX_ACTION } = cssClasses;
    const flags = computed(() => getDialogueActionFlags({ role: props.message.role, status: props.message.status, isLastChat: props.isLastChat, showReset: context.view.value.showReset }));

    const wrapCls = computed(() =>
        normalizeClass([
            PREFIX_ACTION,
            {
                [`${PREFIX_ACTION}-show`]: DialogueActionFoundation.isActionBarShown({ showReset: flags.value.showReset, finished: flags.value.finished, showAction: state.value.showAction }),
                [`${PREFIX_ACTION}-hidden`]: !flags.value.finished,
            },
        ])
    );

    const barKeys = computed(() => getDialogueActionKeys(flags.value, false));

    // the warning renders outside this tree, so its text is read here to follow the LocaleProvider
    const showDeleteModal = (trigger?: HTMLElement) => {
        const list = trigger?.closest<HTMLElement>(`.${PREFIX}-list`);
        Modal.warning({
            title: locale.value.locale.deleteConfirm,
            content: locale.value.locale.deleteContent,
            onOk: foundation.deleteMessage,
            // the deleted message took the more button along; the list takes the focus the modal gives up
            afterClose: () => trigger && handoverFocus(trigger, list),
        });
        foundation.closeMenu();
    };

    const moreProps = () => ({
        visible: state.value.visible,
        onShow: foundation.openMenu,
        onHide: foundation.closeMenu,
        onDelete: showDeleteModal,
    });

    const button = (kind: ActionKind, onClick: () => void, active?: boolean) => h(DialogueActionButton, { key: kind, kind, active, onClick });

    const nodes: Record<DialogueActionKey, () => VNode> = {
        copyNode: () => button('copy', foundation.copyMessage),
        likeNode: () => button('like', foundation.likeMessage, props.message.like),
        dislikeNode: () => button('dislike', foundation.dislikeMessage, props.message.dislike),
        resetNode: () => button('reset', foundation.resetMessage),
        shareNode: () => button('share', foundation.shareMessage),
        editNode: () => button('edit', foundation.editMessage),
        moreNode: () => h(DialogueActionMore, { key: 'more', ...moreProps() }),
    };

    const actionSlotProps = () => {
        const keys = getDialogueActionKeys(flags.value, true);
        const defaultActionsObj: DefaultActionNodeObj = Object.fromEntries(keys.map((key) => [key, nodes[key]()]));
        return {
            message: props.message,
            defaultActions: Object.values(defaultActionsObj),
            defaultActionsObj,
            class: wrapCls.value,
        };
    };
</script>

<template>
    <slot v-if="$slots.action" name="action" v-bind="actionSlotProps()" />
    <div v-else :class="wrapCls">
        <component :is="nodes[key]()" v-for="key in barKeys" :key="key" />
    </div>
</template>
