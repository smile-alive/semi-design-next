<script setup lang="ts">
    import { computed, h } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
    import { useAIChatDialogueContext } from '../context';
    import type { AIChatDialogueSlots, Metadata } from '../interface';

    const props = defineProps<{ message: Message; role?: Metadata }>();
    defineSlots<Pick<AIChatDialogueSlots, 'title'>>();

    const { view } = useAIChatDialogueContext();

    const titleCls = computed(() => [`${cssClasses.PREFIX}-title`, view.value.classNames?.itemTitle]);

    const defaultTitle = () => h('span', { class: titleCls.value, style: view.value.styles?.itemTitle }, props.role?.name);
</script>

<template>
    <slot v-if="$slots.title" :defaultTitle="defaultTitle()" :message="props.message" name="title" :role="props.role" />
    <span v-else :class="titleCls" :style="view.styles?.itemTitle">{{ props.role?.name }}</span>
</template>
