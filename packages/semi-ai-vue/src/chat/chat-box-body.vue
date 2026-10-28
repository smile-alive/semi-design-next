<script setup lang="ts">
    import { computed } from 'vue';
    import { omitBy } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
    import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
    import MarkdownRender from '@fibrae/semi-ui-vue/markdown-render/index';
    import Code from './code.vue';
    import { useChatContext } from './context';
    import FileAttachment from './file-attachment.vue';
    import ImageAttachment from './image-attachment.vue';
    import type { ChatMessage } from './interface';

    const props = defineProps<{ message: ChatMessage }>();

    const { view } = useChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
    const { MESSAGE_STATUS, ROLE } = strings;

    // one object: markdownRenderProps may replace format but never the components
    const markdownProps = computed(() => ({
        format: 'md' as const,
        ...view.value.markdownRenderProps,
        components: {
            code: Code,
            SemiFile: FileAttachment,
            img: ImageAttachment,
            // an explicit undefined entry would replace the built-in component with a non-component
            ...omitBy(view.value.customMarkDownComponents ?? {}, (component) => component === undefined),
        },
    }));

    const raw = (text = '') => (view.value.escapeHtml && props.message.role === ROLE.USER ? escapeHtmlInMarkdown(text) : text);
</script>

<template>
    <span v-if="props.message.status === MESSAGE_STATUS.LOADING" :class="`${PREFIX_CHAT_BOX}-content-loading`">
        <span :class="`${PREFIX_CHAT_BOX}-content-loading-item`" />
    </span>
    <MarkdownRender v-else-if="typeof props.message.content === 'string'" v-bind="markdownProps" :raw="raw(props.message.content)" />
    <template v-else-if="Array.isArray(props.message.content)">
        <template v-for="(item, index) in props.message.content" :key="index">
            <MarkdownRender v-if="item.type === 'text'" v-bind="markdownProps" :raw="raw(item.text)" />
            <ImageAttachment v-else-if="item.type === 'image_url'" :src="item.image_url?.url" />
            <FileAttachment v-else-if="item.type === 'file_url'" :name="item.file_url?.name" :size="item.file_url?.size" :type="getFileType(item.file_url?.name, item.file_url?.type)" :url="item.file_url?.url" />
        </template>
    </template>
</template>
