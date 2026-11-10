<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import ChatFoundation from '@fibrae/semi-ai-foundation/components/chat/foundation';
    import { getFileType } from '@fibrae/semi-ai-foundation/utils/file-suffix';
    import MarkdownRender from '@fibrae/semi-ui-svelte/markdown-render/markdown-render.svelte';
    import { getChatContext } from '../context.js';
    import type { ChatMessage } from '../interface.js';
    import Code from './code.svelte';
    import FileAttachment from './file-attachment.svelte';
    import ImageAttachment from './image-attachment.svelte';

    let { message }: { message: ChatMessage } = $props();

    const { view } = getChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
    const { MESSAGE_STATUS } = strings;

    // one object: markdownRenderProps may replace format but never the components
    const markdownProps = $derived({
        format: 'md' as const,
        ...view.markdownRenderProps,
        components: ChatFoundation.mergeMarkdownComponents({ code: Code, SemiFile: FileAttachment, img: ImageAttachment }, view.customMarkDownComponents),
    });

    const raw = (text?: string) => ChatFoundation.getMarkdownRaw(text, message.role, view.escapeHtml);
</script>

{#if message.status === MESSAGE_STATUS.LOADING}
    <span class="{PREFIX_CHAT_BOX}-content-loading">
        <span class="{PREFIX_CHAT_BOX}-content-loading-item"></span>
    </span>
{:else if typeof message.content === 'string'}
    <MarkdownRender {...markdownProps} raw={raw(message.content)} />
{:else if Array.isArray(message.content)}
    {#each message.content as item, index (index)}
        {#if item.type === 'text'}
            <MarkdownRender {...markdownProps} raw={raw(item.text)} />
        {:else if item.type === 'image_url'}
            <ImageAttachment src={item.image_url?.url} />
        {:else if item.type === 'file_url'}
            <FileAttachment name={item.file_url?.name} size={item.file_url?.size} type={getFileType(item.file_url?.name, item.file_url?.type)} url={item.file_url?.url} />
        {/if}
    {/each}
{/if}
