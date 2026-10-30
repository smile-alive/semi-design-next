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
            role: 'assistant',
            id: '1',
            createAt: 1715676751919,
            content: '请求成功',
        },
        {
            id: 'loading',
            role: 'assistant',
            status: 'loading',
        },
        {
            role: 'assistant',
            id: 'error',
            content: '请求错误',
            status: 'error',
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
</script>

<Chat bind:chats={messages} {onMessageSend} {roleConfig} style="border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px" {uploadProps} />
