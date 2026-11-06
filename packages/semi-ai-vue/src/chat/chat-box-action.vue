<script setup lang="ts">
    import { computed, h, normalizeClass } from 'vue';
    import ChatBoxActionFoundation, { type ChatBoxActionAdapter, type ChatBoxActionState } from '@fibrae/semi-ai-foundation/chat/chat-box-action-foundation';
    import { cssClasses, isUnfinishedMessageStatus, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import ActionButton from './action-button.vue';
    import { useChatContext } from './context';
    import DeleteAction from './delete-action.vue';
    import type { ChatDefaultActionNodeObj, ChatMessage, ChatSlots } from './interface';

    interface ChatBoxActionProps {
        message: ChatMessage;
        isLast: boolean;
    }

    type ActionName = 'copy' | 'like' | 'dislike' | 'reset' | 'delete';
    type Foundation = ChatBoxActionFoundation<ChatBoxActionProps>;
    type Adapter = ChatBoxActionAdapter<ChatBoxActionProps>;

    const props = defineProps<ChatBoxActionProps>();
    defineSlots<Pick<ChatSlots, 'action'>>();

    const context = useChatContext();
    const i18n = useLocale('Chat');

    const { foundation, state } = useFoundation<Foundation, Adapter, ChatBoxActionProps, ChatBoxActionState>(
        ChatBoxActionFoundation,
        props,
        () => ChatBoxActionFoundation.getInitialState(),
        () => ({
            notifyDeleteMessage: () => context.deleteMessage(props.message),
            notifyMessageCopy: () => context.copyMessage(props.message),
            // a function, so the text follows a locale change while the toast shows
            toastCopySuccess: () => context.toast.success({ content: () => i18n.value.locale.copySuccess }),
            notifyLikeMessage: () => context.likeMessage(props.message),
            notifyDislikeMessage: () => context.dislikeMessage(props.message),
            notifyResetMessage: () => context.resetMessage(props.message),
        })
    );

    const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
    const { ROLE, MESSAGE_STATUS } = strings;
    const status = computed(() => props.message.status ?? MESSAGE_STATUS.COMPLETE);

    const actions = computed(() => {
        const { role } = props.message;
        const complete = status.value === MESSAGE_STATUS.COMPLETE;
        const names: ActionName[] = [];
        if (complete) {
            names.push('copy');
        }
        if (complete && role !== ROLE.USER) {
            names.push('like', 'dislike');
        }
        if (props.isLast && role === ROLE.ASSISTANT) {
            names.push('reset');
        }
        names.push('delete');
        return names;
    });

    const wrapClass = computed(() => {
        const finished = !isUnfinishedMessageStatus(status.value);
        return normalizeClass([
            PREFIX_CHAT_BOX_ACTION,
            {
                [`${PREFIX_CHAT_BOX_ACTION}-show`]: (actions.value.includes('reset') && finished) || state.value.showAction,
                [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !finished,
            },
        ]);
    });

    const handlers = {
        copy: foundation.copyMessage,
        like: foundation.likeMessage,
        dislike: foundation.dislikeMessage,
        reset: foundation.resetMessage,
    };

    const active = (name: Exclude<ActionName, 'delete'>) => (name === 'like' && Boolean(props.message.like)) || (name === 'dislike' && Boolean(props.message.dislike));

    const actionNode = (name: ActionName) =>
        name === 'delete'
            ? h(DeleteAction, {
                  visible: state.value.visible,
                  onShow: foundation.showDeletePopup,
                  onHide: foundation.hideDeletePopup,
                  onConfirm: foundation.deleteMessage,
              })
            : h(ActionButton, { name, active: active(name), onClick: handlers[name] });

    const slotProps = () => {
        const defaultActionsObj: ChatDefaultActionNodeObj = Object.fromEntries(actions.value.map((name) => [`${name}Node`, actionNode(name)]));
        return { defaultActions: Object.values(defaultActionsObj), defaultActionsObj };
    };
</script>

<template>
    <slot v-if="$slots.action" :class="wrapClass" :message="props.message" name="action" v-bind="slotProps()" />
    <div v-else :class="wrapClass">
        <template v-for="name in actions" :key="name">
            <DeleteAction v-if="name === 'delete'" :visible="state.visible" @confirm="foundation.deleteMessage" @hide="foundation.hideDeletePopup" @show="foundation.showDeletePopup" />
            <ActionButton v-else :active="active(name)" :name="name" @click="handlers[name]" />
        </template>
    </div>
</template>
