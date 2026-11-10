<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import ChatFoundation from '@fibrae/semi-ai-foundation/components/chat/foundation';
    import { getFileType } from '@fibrae/semi-ai-foundation/utils/file-suffix';
    import MarkdownRender from '@fibrae/semi-ui-vue/markdown-render/index';
    import { useChatContext } from '../context';
    import type { ChatMessage } from '../interface';
    import Code from './code.vue';
    import FileAttachment from './file-attachment.vue';
    import ImageAttachment from './image-attachment.vue';

    const props = defineProps<{ message: ChatMessage }>();

    const { view } = useChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
    const { MESSAGE_STATUS } = strings;

    // one object: markdownRenderProps may replace format but never the components
    const markdownProps = computed(() => ({
        format: 'md' as const,
        ...view.value.markdownRenderProps,
        components: ChatFoundation.mergeMarkdownComponents({ code: Code, SemiFile: FileAttachment, img: ImageAttachment }, view.value.customMarkDownComponents),
    }));

    const raw = (text?: string) => ChatFoundation.getMarkdownRaw(text, props.message.role, view.value.escapeHtml);
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
