<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { messageToChatInput } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getMessageText } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-text';
    import { IconAlertCircle } from '@fibrae/semi-icons-vue';
    import DialogueContentItem from './dialogue-content-item.vue';
    import DialogueMarkdown from './dialogue-markdown.vue';
    import type { AIChatDialogueSlots } from './interface';

    const props = defineProps<{ message: Message; editing: boolean }>();
    defineSlots<Pick<AIChatDialogueSlots, 'contentItem' | 'messageText' | 'messageEdit'>>();

    const { PREFIX_CONTENT } = cssClasses;
    const { STATUS } = strings;
    const textContent = computed(() => (Array.isArray(props.message.content) ? undefined : getMessageText(props.message)));
    const items = computed(() => (Array.isArray(props.message.content) ? props.message.content : []));
    const failed = computed(() => props.message.status === STATUS.FAILED || props.message.status === STATUS.CANCELLED);
</script>

<template>
    <slot v-if="props.editing" name="messageEdit" v-bind="messageToChatInput(props.message)" />
    <div v-else :class="`${PREFIX_CONTENT}-wrapper`">
        <div v-if="failed" :class="`${PREFIX_CONTENT}-failed`"><IconAlertCircle /></div>
        <div :class="`${PREFIX_CONTENT}-inner`">
            <template v-if="textContent">
                <div v-if="$slots.messageText" :class="`${PREFIX_CONTENT}-custom-renderer`">
                    <slot :message="props.message" name="messageText" :text="textContent" />
                </div>
                <DialogueMarkdown v-else :message="props.message" :text="textContent" />
            </template>
            <DialogueContentItem v-for="(item, index) in items" :key="index" :index="index" :item="item" :message="props.message">
                <template v-if="$slots.contentItem" #contentItem="slotProps">
                    <slot name="contentItem" v-bind="slotProps" />
                </template>
            </DialogueContentItem>
        </div>
    </div>
</template>
