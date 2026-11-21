<script setup lang="ts">
    import { computed, h } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import { useChatContext } from '../context';
    import type { ChatMessage, ChatMetadata, ChatSlots } from '../interface';

    const props = defineProps<{ message: ChatMessage; role: ChatMetadata }>();
    defineSlots<Pick<ChatSlots, 'title'>>();

    const { view } = useChatContext();

    const titleClass = computed(() => [`${cssClasses.PREFIX_CHAT_BOX}-title`, view.value.classNames?.itemTitle]);

    const defaultTitle = () => h('span', { class: titleClass.value, style: view.value.styles?.itemTitle }, props.role.name);
</script>

<template>
    <slot v-if="$slots.title" :defaultTitle="defaultTitle()" :message="props.message" name="title" :role="props.role" />
    <span v-else :class="titleClass" :style="view.styles?.itemTitle">{{ props.role.name }}</span>
</template>
