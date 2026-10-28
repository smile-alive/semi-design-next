<script setup lang="ts">
    import { computed, h, normalizeClass } from 'vue';
    import DialogueActionFoundation, { type DialogueActionAdapter, getDialogueActionFlags } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/action-foundation';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Modal from '@fibrae/semi-ui-vue/modal/index';
    import Toast from '@fibrae/semi-ui-vue/toast/index';
    import { useAIChatDialogueContext } from './context';
    import DialogueActionButton from './dialogue-action-button.vue';
    import DialogueActionMore from './dialogue-action-more.vue';
    import type { AIChatDialogueSlots, DefaultActionNodeObj } from './interface';

    interface DialogueActionProps {
        message: Message;
        isLastChat: boolean;
    }

    type ActionKind = InstanceType<typeof DialogueActionButton>['$props']['kind'];

    interface DialogueActionState {
        visible: boolean;
        showAction: boolean;
    }

    type Foundation = DialogueActionFoundation<DialogueActionProps, DialogueActionState>;
    type Adapter = DialogueActionAdapter<DialogueActionProps, DialogueActionState>;

    const props = defineProps<DialogueActionProps>();
    defineSlots<Pick<AIChatDialogueSlots, 'action'>>();

    const context = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { foundation, state } = useFoundation<Foundation, Adapter, DialogueActionProps, DialogueActionState>(
        DialogueActionFoundation,
        props,
        () => ({ visible: false, showAction: false }),
        (base) => ({
            notifyMessageCopy: () => context.messageCopy(props.message),
            toastCopySuccess: () => Toast.success({ content: locale.value.locale.copySuccess }),
            notifyLikeMessage: () => context.messageGoodFeedback(props.message),
            notifyDislikeMessage: () => context.messageBadFeedback(props.message),
            notifyResetMessage: () => context.messageReset(props.message),
            notifyShareMessage: () => context.messageShare(props.message),
            notifyEditMessage: () => context.messageEdit(props.message),
            notifyDeleteMessage: () => context.messageDelete(props.message),
            setVisible: (visible: boolean) => base.setState({ visible }),
            setShowAction: (showAction: boolean) => base.setState({ showAction }),
        })
    );

    const { PREFIX, PREFIX_ACTION } = cssClasses;
    const { view } = context;

    const flags = computed(() => {
        const { finished, ...rest } = getDialogueActionFlags({ role: props.message.role, status: props.message.status, isLastChat: props.isLastChat, showReset: view.value.showReset });
        return {
            ...rest,
            wrapCls: normalizeClass([
                PREFIX_ACTION,
                {
                    [`${PREFIX_ACTION}-show`]: (rest.showReset && finished) || state.value.showAction,
                    [`${PREFIX_ACTION}-hidden`]: !finished,
                },
            ]),
        };
    });

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
        foundation.hideMoreDropdown();
    };

    const moreProps = () => ({
        visible: state.value.visible,
        onShow: foundation.showMoreDropdown,
        onHide: foundation.hideMoreDropdown,
        onDelete: showDeleteModal,
    });

    const defaultActionsObj = () => {
        const { completed, showFeedback, showReset, showEdit } = flags.value;
        const { like, dislike } = props.message;
        const button = (kind: ActionKind, onClick: () => void, active?: boolean) => h(DialogueActionButton, { key: kind, kind, active, onClick });
        const nodes: DefaultActionNodeObj = {};
        if (completed) {
            nodes.copyNode = button('copy', foundation.copyMessage);
        }
        if (showFeedback) {
            nodes.likeNode = button('like', foundation.likeMessage, like);
            nodes.dislikeNode = button('dislike', foundation.dislikeMessage, dislike);
        }
        if (showReset) {
            nodes.resetNode = button('reset', foundation.resetMessage);
        }
        if (completed) {
            nodes.shareNode = button('share', foundation.shareMessage);
        }
        if (showEdit) {
            nodes.editNode = button('edit', foundation.editMessage);
        }
        nodes.moreNode = h(DialogueActionMore, { key: 'more', ...moreProps() });
        return nodes;
    };

    const actionSlotProps = () => {
        const nodes = defaultActionsObj();
        return {
            message: props.message,
            defaultActions: Object.values(nodes),
            defaultActionsObj: nodes,
            class: flags.value.wrapCls,
        };
    };
</script>

<template>
    <slot v-if="$slots.action" name="action" v-bind="actionSlotProps()" />
    <div v-else :class="flags.wrapCls">
        <DialogueActionButton v-if="flags.completed" kind="copy" @click="foundation.copyMessage" />
        <DialogueActionButton v-if="flags.showReset" kind="reset" @click="foundation.resetMessage" />
        <DialogueActionButton v-if="flags.completed" kind="share" @click="foundation.shareMessage" />
        <DialogueActionButton v-if="flags.showEdit" kind="edit" @click="foundation.editMessage" />
        <template v-if="flags.showFeedback">
            <DialogueActionButton :active="props.message.like" kind="like" @click="foundation.likeMessage" />
            <DialogueActionButton :active="props.message.dislike" kind="dislike" @click="foundation.dislikeMessage" />
        </template>
        <DialogueActionMore v-bind="moreProps()" />
    </div>
</template>
