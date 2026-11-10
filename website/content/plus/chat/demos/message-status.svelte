<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const roleInfo = {
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

    const commonOuterStyle = 'border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px';
    const uploadProps = { action: '/upload', customRequest: mockUpload };

    let id = 0;
    const getId = () => `id-${id++}`;

    let message = $state<ChatMessage[]>([
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
            message = [...message, newAssistantMessage];
        }, 200);
    };
</script>

<Chat bind:chats={message} {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} {uploadProps} />
