<script setup lang="ts">
    import { type VNode, computed, h, normalizeClass } from 'vue';
    import ChatBoxActionFoundation, { type ChatBoxActionAdapter, type ChatBoxActionKey, type ChatBoxActionState, getChatBoxActionFlags, getChatBoxActionKeys } from '@fibrae/semi-ai-foundation/components/chat/chat-box-action-foundation';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import useFoundation from '@fibrae/semi-ui-vue/base/use-foundation';
    import { useLocale } from '@fibrae/semi-ui-vue/composables';
    import { useChatContext } from '../context';
    import type { ChatDefaultActionNodeObj, ChatMessage, ChatSlots } from '../interface';
    import ActionButton from './action-button.vue';
    import DeleteAction from './delete-action.vue';

    interface ChatBoxActionProps {
        message: ChatMessage;
        isLast: boolean;
    }

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
    const flags = computed(() => getChatBoxActionFlags({ role: props.message.role, status: props.message.status, isLast: props.isLast }));
    const keys = computed(() => getChatBoxActionKeys(flags.value));

    const wrapClass = computed(() =>
        normalizeClass([
            PREFIX_CHAT_BOX_ACTION,
            {
                [`${PREFIX_CHAT_BOX_ACTION}-show`]: ChatBoxActionFoundation.isActionBarShown({ showReset: flags.value.showReset, finished: flags.value.finished, showAction: state.value.showAction }),
                [`${PREFIX_CHAT_BOX_ACTION}-hidden`]: !flags.value.finished,
            },
        ])
    );

    const nodes: Record<ChatBoxActionKey, () => VNode> = {
        copyNode: () => h(ActionButton, { name: 'copy', active: false, onClick: foundation.copyMessage }),
        likeNode: () => h(ActionButton, { name: 'like', active: Boolean(props.message.like), onClick: foundation.likeMessage }),
        dislikeNode: () => h(ActionButton, { name: 'dislike', active: Boolean(props.message.dislike), onClick: foundation.dislikeMessage }),
        resetNode: () => h(ActionButton, { name: 'reset', active: false, onClick: foundation.resetMessage }),
        deleteNode: () => h(DeleteAction, { visible: state.value.visible, onShow: foundation.openMenu, onHide: foundation.closeMenu, onConfirm: foundation.deleteMessage }),
    };

    const slotProps = () => {
        const defaultActionsObj: ChatDefaultActionNodeObj = Object.fromEntries(keys.value.map((key) => [key, nodes[key]()]));
        return { defaultActions: Object.values(defaultActionsObj), defaultActionsObj };
    };
</script>

<template>
    <slot v-if="$slots.action" :class="wrapClass" :message="props.message" name="action" v-bind="slotProps()" />
    <div v-else :class="wrapClass">
        <component :is="nodes[key]()" v-for="key in keys" :key="key" />
    </div>
</template>
