<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { ContentItem, CustomToolCall, FunctionToolCall, InputFile, InputImage, InputMessage, Message, OutputMessage, OutputText, Reasoning, Refusal } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getAttachmentLayout, getVisibleAnnotations, isImageList } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-content';
    import { IconWrench } from '@fibrae/semi-icons-svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Image from '@fibrae/semi-ui-svelte/image/image.svelte';
    import { getAIChatDialogueContext } from './context.js';
    import DialogueContentItem from './dialogue-content-item.svelte';
    import DialogueFile from './dialogue-file.svelte';
    import DialogueMarkdown from './dialogue-markdown.svelte';
    import type { MessageInnerItem } from './interface.js';
    import AnnotationWidget from './widgets/content-item/annotation.svelte';
    import ReasoningWidget from './widgets/content-item/reasoning.svelte';

    interface DialogueContentItemProps {
        item: ContentItem | MessageInnerItem;
        message: Message;
        index: number;
        parent?: InputMessage | OutputMessage;
    }

    let { item, message, index, parent }: DialogueContentItemProps = $props();

    const { view, snippets, annotationClick, imageClick } = getAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const { MESSAGE_ITEM_TYPE, TEXT_TYPES } = strings;
    const type = $derived(parent ? item?.type : (item?.type ?? MESSAGE_ITEM_TYPE.MESSAGE));
    const siblings = $derived((parent?.content ?? []) as MessageInnerItem[]);
    const layout = $derived(getAttachmentLayout(siblings, index));
    const imageList = $derived(isImageList(siblings));
    const citations = $derived(getVisibleAnnotations(item as OutputText));
    const text = $derived((item as OutputText).text ?? '');
    const refusal = $derived((item as Refusal).refusal ?? '');
    const image = $derived(item as InputImage);
    const messageItem = $derived(item as InputMessage | OutputMessage);
    const reasoning = $derived(item as Reasoning);
    const toolCall = $derived(item as FunctionToolCall & CustomToolCall);
</script>

{#snippet defaultItem()}
    {#if parent}
        {#if type !== undefined && TEXT_TYPES.includes(type)}
            {#if citations.length > 0}
                <AnnotationWidget annotation={citations} maxCount={15} onClick={() => annotationClick(citations)} />
            {/if}
            {#if text !== ''}
                <DialogueMarkdown {message} {text} />
            {/if}
            {#if refusal !== ''}
                <DialogueMarkdown {message} text={refusal} />
            {/if}
        {:else if type === MESSAGE_ITEM_TYPE.INPUT_IMAGE}
            <Image alt={locale().locale.image} class={[`${PREFIX_CONTENT}-img`, { [`${PREFIX_CONTENT}-img-list`]: imageList, [`${PREFIX_CONTENT}-img-last`]: layout.isLast }]} src={image.image_url} onclick={() => imageClick(image)} />
            {#if layout.breakAfter}
                <br />
            {/if}
        {:else if type === MESSAGE_ITEM_TYPE.INPUT_FILE}
            <DialogueFile file={item as InputFile} isLastFile={layout.isLast} role={message.role} />
            {#if layout.breakAfter}
                <br />
            {/if}
        {/if}
    {:else if type === MESSAGE_ITEM_TYPE.MESSAGE}
        {#if typeof messageItem.content === 'string'}
            {#if messageItem.content !== ''}
                <DialogueMarkdown {message} text={messageItem.content} />
            {/if}
        {:else}
            {#each messageItem.content ?? [] as inner, innerIndex (innerIndex)}
                <DialogueContentItem index={innerIndex} item={inner} {message} parent={messageItem} />
            {/each}
        {/if}
    {:else if type === MESSAGE_ITEM_TYPE.REASONING}
        <ReasoningWidget content={reasoning.content} markdownRenderProps={view.markdownRenderProps} status={reasoning.status} summary={reasoning.summary} />
    {:else if type === MESSAGE_ITEM_TYPE.FUNCTION_CALL || type === MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL}
        <div class="{PREFIX_CONTENT}-tool-call"><IconWrench />{toolCall.name} {toolCall.arguments ?? toolCall.input}</div>
    {/if}
{/snippet}

{#if snippets.contentItem}
    {@render snippets.contentItem({ class: `${PREFIX_CONTENT}-custom-renderer`, defaultItem, index, item, message, parent, type })}
{:else}
    {@render defaultItem()}
{/if}
