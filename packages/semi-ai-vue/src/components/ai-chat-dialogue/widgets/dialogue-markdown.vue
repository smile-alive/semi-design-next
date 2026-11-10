<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
    import DialogueFoundation, { type Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
    import { IconSendMsgStroked } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/composables';
    import MarkdownRender from '@fibrae/semi-ui-vue/markdown-render/index';
    import { useAIChatDialogueContext } from '../context';
    import Code from './content-item/code.vue';

    const props = defineProps<{ text: string; message: Message }>();

    const { view, referenceClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const wrapCls = computed(() => DialogueFoundation.getContentClass(props.message.role, props.message.status, view.value.mode));
    const { PREFIX_CONTENT } = cssClasses;
    const { ROLE } = strings;
    const isUser = computed(() => props.message.role === ROLE.USER);

    const markdownProps = computed(() => {
        const { markdownRenderProps } = view.value;
        return {
            format: 'md' as const,
            ...markdownRenderProps,
            components: DialogueFoundation.mergeMarkdownComponents({ code: Code }, markdownRenderProps?.components),
            raw: DialogueFoundation.getMarkdownRaw(props.text, props.message.role, view.value.escapeHtml),
        };
    });
</script>

<template>
    <div :class="wrapCls">
        <MarkdownRender v-bind="markdownProps" />
        <button v-if="isUser && view.showReference" :aria-label="locale.locale.reference" :class="`${PREFIX_CONTENT}-icon-reference`" type="button" @click="referenceClick({ type: 'text', content: props.text })">
            <IconSendMsgStroked />
        </button>
    </div>
</template>
