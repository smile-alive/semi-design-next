<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';

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

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    let messages = $state<ChatMessage[]>([
        {
            role: 'system',
            id: '1',
            createAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
        {
            role: 'user',
            id: '2',
            createAt: 1715676751919,
            content: '介绍一下 semi design',
        },
        {
            role: 'assistant',
            id: '3',
            createAt: 1715676751919,
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统',
        },
    ]);

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            messages = [...messages, newAssistantMessage];
        }, 200);
    };

    const onMessageReset = () => {
        setTimeout(() => {
            const lastMessage = messages[messages.length - 1];
            const newLastMessage: ChatMessage = {
                ...lastMessage,
                status: 'complete',
                content: 'This is a mock reset message.',
            };
            messages = [...messages.slice(0, -1), newLastMessage];
        }, 200);
    };
</script>

<Chat bind:chats={messages} {onMessageReset} {onMessageSend} {roleConfig} showClearContext style="border: 1px solid var(--semi-color-border); border-radius: 16px; margin: 8px 16px; height: 550px" {uploadProps}>
    {#snippet uploadTip()}自定义上传按钮提示信息{/snippet}
</Chat>
