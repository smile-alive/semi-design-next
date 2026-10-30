<script lang="ts">
    import { AIChatDialogue, type AIChatDialogueAnnotation as Annotation, type AIChatDialogueContentItemSnippetProps as ContentItemSnippetProps, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';
    import { MarkdownRender, Toast } from '@fibrae/semi-ui-svelte';

    // The fields of the content items this demo renders; the snippet types `item` as the union of every item type.
    interface DemoItem {
        name?: string;
        arguments?: string;
        text?: string;
        status?: string;
        summary?: { text?: string; type?: string }[];
        annotations?: Annotation[];
    }

    const roleConfig = {
        user: {
            name: 'User',
            avatar: '/assets/docs-icon.png',
        },
        assistant: {
            name: 'Assistant',
            avatar: '/assets/placeholder/logo.svg',
        },
        system: {
            name: 'System',
            avatar: '/assets/placeholder/logo.svg',
        },
    };

    let messages = $state<Message[]>([
        {
            id: '1',
            role: 'user',
            content: '你好',
        },
        {
            id: '2',
            role: 'assistant',
            content: '你好呀，请问有什么可以帮助你的吗~',
            status: 'completed',
        },
        {
            id: '3',
            role: 'user',
            content: [
                {
                    type: 'message',
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: '帮我生成类似的图片',
                        },
                        {
                            type: 'input_image',
                            image_url: '/assets/root-web-sites/edit-bag.jpeg',
                            file_id: 'demo-file-id',
                        },
                        {
                            type: 'input_image',
                            image_url: '/assets/root-web-sites/edit-bag.jpeg',
                            file_id: 'demo-file-id',
                        },
                    ],
                },
            ],
        },
        {
            id: '4',
            role: 'assistant',
            content: [
                {
                    type: 'reasoning',
                    summary: [
                        {
                            type: 'summary_text',
                            text: '\n用户问需要我帮助他生成类似图片，我需要先分析图片内容，然后生成类似的图片...',
                        },
                    ],
                    annotations: [
                        {
                            title: 'semi.design',
                            url: 'https://semi.design/',
                            detail: 'semi design page',
                            logo: '/assets/placeholder/logo.svg',
                        },
                        {
                            title: 'semi.design',
                            url: 'https://semi.design/',
                            detail: 'semi design page',
                            logo: '/assets/placeholder/logo.svg',
                        },
                    ],
                    status: 'completed',
                },
                {
                    type: 'function_call',
                    name: 'create_travel_guide',
                    arguments: '{\n"city": "北京"\n}',
                    status: 'completed',
                },
            ],
            status: 'completed',
        },
    ]);

    const userTextStyle = 'background-color: var(--semi-color-fill-1); color: var(--semi-color-text-0); border-radius: 25px; padding: 6px 16px';

    const assistantStyle = 'color: var(--semi-color-text-0); padding: 6px 16px';

    const functionCallStyle = 'background-color: var(--semi-color-fill-1); padding: 6px 16px; border-radius: 25px';

    const fields = (item: ContentItemSnippetProps['item']) => item as DemoItem;

    const onAnnotationClick = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        Toast.success('Ready to open the sidebar!');
    };
</script>

<AIChatDialogue bind:chats={messages} {roleConfig}>
    {#snippet contentItem({ item, type, message, defaultItem, class: className })}
        {#if type === 'function_call' && fields(item).name === 'create_travel_guide'}
            <div class={className} style={functionCallStyle}>Function Tool Call: {fields(item).name} {fields(item).arguments}</div>
        {:else if type === 'input_text'}
            {#if message.role === 'user'}
                <div class={[className, 'userTextStyle']} style={userTextStyle}>
                    {fields(item).text}
                </div>
            {:else}
                <div class={className} style={assistantStyle}>{fields(item).text}</div>
            {/if}
        {:else if type === 'reasoning'}
            <AIChatDialogue.Reasoning class={className} status={fields(item).status} summary={fields(item).summary}>
                {#snippet children({ summary, markdownRenderProps })}
                    <AIChatDialogue.Annotation annotation={fields(item).annotations ?? []} description="参考资料" maxCount={3} onClick={onAnnotationClick} />
                    <div style="margin-top: 8px">
                        <MarkdownRender format="md" {...markdownRenderProps} raw={summary?.[0]?.text ?? ''} />
                    </div>
                {/snippet}
            </AIChatDialogue.Reasoning>
        {:else}
            {@render defaultItem()}
        {/if}
    {/snippet}
    {#snippet messageText({ text, message })}
        {#if message.role === 'user'}
            <div class="userTextStyle" style={userTextStyle}>{text}</div>
        {:else}
            <div style={assistantStyle}>{text}</div>
        {/if}
    {/snippet}
</AIChatDialogue>
