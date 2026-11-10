<script setup lang="ts">
    import { computed, h } from 'vue';
    import ChatFoundation from '@fibrae/semi-ai-foundation/components/chat/foundation';
    import { useChatContext } from '../context';
    import type { ChatMessage, ChatMetadata, ChatSlots } from '../interface';
    import ChatBoxBody from './chat-box-body.vue';

    const props = defineProps<{ message: ChatMessage; role: ChatMetadata }>();
    defineSlots<Pick<ChatSlots, 'content'>>();

    const { view } = useChatContext();

    const wrapClass = computed(() => ChatFoundation.getContentClass(props.message.role, props.message.status, view.value.mode));

    const defaultContent = () => h(ChatBoxBody, { message: props.message });
</script>

<template>
    <slot v-if="$slots.content" :class="wrapClass" :defaultContent="defaultContent()" :message="props.message" name="content" :role="props.role" />
    <div v-else :class="wrapClass"><ChatBoxBody :message="props.message" /></div>
</template>
