<script setup lang="ts">
    import { computed, h, normalizeClass } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import ChatBoxAction from './chat-box-action.vue';
    import ChatBoxAvatar from './chat-box-avatar.vue';
    import ChatBoxContent from './chat-box-content.vue';
    import ChatBoxTitle from './chat-box-title.vue';
    import { useChatContext } from './context';
    import type { ChatFullChatBoxNodes, ChatMessage, ChatMetadata, ChatSlots } from './interface';

    type BoxSlots = Pick<ChatSlots, 'title' | 'avatar' | 'roleAvatar' | 'content' | 'action' | 'fullChatBox'>;

    const props = defineProps<{ message: ChatMessage; continueSend: boolean; isLast: boolean }>();
    const slots = defineSlots<BoxSlots>();

    const { view } = useChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
    const { ROLE, CHAT_ALIGN } = strings;
    const role = computed<ChatMetadata>(() => view.value.roleConfig?.[props.message.role ?? ''] ?? {});

    const boxClass = computed(() =>
        normalizeClass([
            PREFIX_CHAT_BOX,
            {
                [`${PREFIX_CHAT_BOX}-right`]: props.message.role === ROLE.USER && view.value.align === CHAT_ALIGN.LEFT_RIGHT,
            },
        ])
    );

    // #fullChatBox receives these nodes and the default branch renders them. Each part reads only its own slot names, so
    // the whole slots object is passed; it holds only the slots given, which each part reads for presence.
    const defaultNodes = (): ChatFullChatBoxNodes => {
        const { message, continueSend, isLast } = props;
        return {
            avatar: h(ChatBoxAvatar, { message, role: role.value, continueSend }, slots),
            title: h(ChatBoxTitle, { message, role: role.value }, slots),
            content: h(ChatBoxContent, { message, role: role.value }, slots),
            action: h(ChatBoxAction, { message, isLast }, slots),
        };
    };
</script>

<template>
    <slot v-if="$slots.fullChatBox" :class="boxClass" :defaultNodes="defaultNodes()" :message="props.message" name="fullChatBox" :role="role" />
    <div v-for="(nodes, i) in [defaultNodes()]" v-else :key="i" :class="boxClass">
        <component :is="nodes.avatar" />
        <div :class="`${PREFIX_CHAT_BOX}-wrap`">
            <component :is="nodes.title" v-if="!props.continueSend" />
            <component :is="nodes.content" />
            <component :is="nodes.action" />
        </div>
    </div>
</template>
