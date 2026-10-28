<script setup lang="ts">
    import { h } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import type { ChatMessage, ChatMetadata, ChatSlots } from './interface';

    const props = defineProps<{ message: ChatMessage; role: ChatMetadata }>();
    defineSlots<Pick<ChatSlots, 'title'>>();

    const titleClass = `${cssClasses.PREFIX_CHAT_BOX}-title`;

    const defaultTitle = () => h('span', { class: titleClass }, props.role.name);
</script>

<template>
    <slot v-if="$slots.title" :defaultTitle="defaultTitle()" :message="props.message" name="title" :role="props.role" />
    <span v-else :class="titleClass">{{ props.role.name }}</span>
</template>
