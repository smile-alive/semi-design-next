<script setup lang="ts">
    import { h } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import type { AIChatDialogueSlots, Metadata } from './interface';

    const props = defineProps<{ message: Message; role?: Metadata }>();
    defineSlots<Pick<AIChatDialogueSlots, 'title'>>();

    const titleCls = `${cssClasses.PREFIX}-title`;

    const defaultTitle = () => h('span', { class: titleCls }, props.role?.name);
</script>

<template>
    <slot v-if="$slots.title" :defaultTitle="defaultTitle()" :message="props.message" name="title" :role="props.role" />
    <span v-else :class="titleCls">{{ props.role?.name }}</span>
</template>
