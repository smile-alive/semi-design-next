<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { AIChatDialogue, type AIChatDialogueAnnotation as Annotation, type AIChatDialogueContentItemSlotProps as ContentItemSlotProps, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-vue';
    import { MarkdownRender, Toast } from '@fibrae/semi-ui-vue';

    // The fields of the content items this demo renders; the slot types `item` as the union of every item type.
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

    const defaultMessages: Message[] = [
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
                            title: 'semi-design-next.pages.dev',
                            url: 'https://semi-design-next.pages.dev/',
                            detail: 'semi design page',
                            logo: '/assets/placeholder/logo.svg',
                        },
                        {
                            title: 'semi-design-next.pages.dev',
                            url: 'https://semi-design-next.pages.dev/',
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
    ];

    const messages = shallowRef(defaultMessages);

    const userTextStyle = {
        backgroundColor: 'var(--semi-color-fill-1)',
        color: 'var(--semi-color-text-0)',
        borderRadius: '25px',
        padding: '6px 16px',
    };

    const assistantStyle = {
        color: 'var(--semi-color-text-0)',
        padding: '6px 16px',
    };

    const functionCallStyle = {
        backgroundColor: 'var(--semi-color-fill-1)',
        padding: '6px 16px',
        borderRadius: '25px',
    };

    const fields = (item: ContentItemSlotProps['item']) => item as DemoItem;

    const onAnnotationClick = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        Toast.success('Ready to open the sidebar!');
    };
</script>

<template>
    <AIChatDialogue v-model:chats="messages" :roleConfig="roleConfig">
        <template #contentItem="contentItem">
            <div v-if="contentItem.type === 'function_call' && fields(contentItem.item).name === 'create_travel_guide'" :style="functionCallStyle">Function Tool Call: {{ fields(contentItem.item).name }} {{ fields(contentItem.item).arguments }}</div>
            <template v-else-if="contentItem.type === 'input_text'">
                <div v-if="contentItem.message.role === 'user'" class="userTextStyle" :style="userTextStyle">
                    {{ fields(contentItem.item).text }}
                </div>
                <div v-else :style="assistantStyle">{{ fields(contentItem.item).text }}</div>
            </template>
            <AIChatDialogue.Reasoning v-else-if="contentItem.type === 'reasoning'" :status="fields(contentItem.item).status" :summary="fields(contentItem.item).summary">
                <template #content="reasoning">
                    <AIChatDialogue.Annotation :annotation="fields(contentItem.item).annotations ?? []" description="参考资料" :maxCount="3" @click="onAnnotationClick" />
                    <div :style="{ marginBlockStart: '8px' }">
                        <MarkdownRender format="md" v-bind="reasoning.markdownRenderProps" :raw="reasoning.summary?.[0]?.text ?? ''" />
                    </div>
                </template>
            </AIChatDialogue.Reasoning>
        </template>
        <template #messageText="messageText">
            <div v-if="messageText.message.role === 'user'" class="userTextStyle" :style="userTextStyle">{{ messageText.text }}</div>
            <div v-else :style="assistantStyle">{{ messageText.text }}</div>
        </template>
    </AIChatDialogue>
</template>
