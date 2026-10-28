<script setup lang="ts">
    import { computed, h, normalizeClass } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import ChatFoundation from '@fibrae/semi-ai-foundation/chat/foundation';
    import ChatBoxBody from './chat-box-body.vue';
    import { useChatContext } from './context';
    import type { ChatMessage, ChatMetadata, ChatSlots } from './interface';

    const props = defineProps<{ message: ChatMessage; role: ChatMetadata }>();
    defineSlots<Pick<ChatSlots, 'content'>>();

    const { view } = useChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;

    const wrapClass = computed(() => {
        const { mode } = view.value;
        const { bubble, user, error } = ChatFoundation.getContentFlags(props.message.role, props.message.status, mode);
        return normalizeClass([
            `${PREFIX_CHAT_BOX}-content`,
            {
                [`${PREFIX_CHAT_BOX}-content-${mode}`]: bubble,
                [`${PREFIX_CHAT_BOX}-content-user`]: user,
                [`${PREFIX_CHAT_BOX}-content-error`]: error,
            },
        ]);
    });

    const defaultContent = () => h(ChatBoxBody, { message: props.message });
</script>

<template>
    <slot v-if="$slots.content" :class="wrapClass" :defaultContent="defaultContent()" :message="props.message" name="content" :role="props.role" />
    <div v-else :class="wrapClass"><ChatBoxBody :message="props.message" /></div>
</template>
