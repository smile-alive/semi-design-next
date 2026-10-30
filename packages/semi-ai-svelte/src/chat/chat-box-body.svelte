<script lang="ts">
    import { omitBy } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
    import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
    import MarkdownRender from '@fibrae/semi-ui-svelte/markdown-render/markdown-render.svelte';
    import Code from './code.svelte';
    import { getChatContext } from './context.js';
    import FileAttachment from './file-attachment.svelte';
    import ImageAttachment from './image-attachment.svelte';
    import type { ChatMessage } from './interface.js';

    let { message }: { message: ChatMessage } = $props();

    const { view } = getChatContext();

    const { PREFIX_CHAT_BOX } = cssClasses;
    const { MESSAGE_STATUS, ROLE } = strings;

    // one object: markdownRenderProps may replace format but never the components
    const markdownProps = $derived({
        format: 'md' as const,
        ...view.markdownRenderProps,
        components: {
            code: Code,
            SemiFile: FileAttachment,
            img: ImageAttachment,
            // an explicit undefined entry would replace the built-in component with a non-component
            ...omitBy(view.customMarkDownComponents ?? {}, (component) => component === undefined),
        },
    });

    const raw = (text = '') => (view.escapeHtml && message.role === ROLE.USER ? escapeHtmlInMarkdown(text) : text);
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
