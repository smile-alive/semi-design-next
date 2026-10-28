<script setup lang="ts">
    import { computed } from 'vue';
    import { omitBy } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
    import { IconSendMsgStroked } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import MarkdownRender from '@fibrae/semi-ui-vue/markdown-render/index';
    import { useAIChatDialogueContext } from './context';
    import useContentClass from './use-content-class';
    import Code from './widgets/content-item/code.vue';

    const props = defineProps<{ text: string; message: Message }>();

    const { view, referenceClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const wrapCls = useContentClass(() => props.message);

    const { PREFIX_CONTENT } = cssClasses;
    const { ROLE } = strings;
    const isUser = computed(() => props.message.role === ROLE.USER);

    const markdownProps = computed(() => {
        const { markdownRenderProps } = view.value;
        return {
            format: 'md' as const,
            ...markdownRenderProps,
            // an explicit undefined entry would replace the built-in component with a non-component
            components: { code: Code, ...omitBy(markdownRenderProps?.components ?? {}, (component) => component === undefined) },
            raw: view.value.escapeHtml && isUser.value ? escapeHtmlInMarkdown(props.text) : props.text,
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
