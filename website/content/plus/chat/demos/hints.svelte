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

    const hintsExample = ['告诉我更多', 'Semi Design 的组件有哪些？', '我能够自定义主题吗？'];
    const commonOuterStyle = 'border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px';
    const uploadProps = { action: '/upload', customRequest: mockUpload };

    let id = 0;
    const getId = () => `id-${id++}`;

    let message = $state<ChatMessage[]>([
        {
            role: 'assistant',
            id: '1',
            createAt: 1715676751919,
            content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用，你可以向我提问任何关于 Semi 的问题。',
        },
    ]);
    let hints = $state(hintsExample);

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

<Chat bind:chats={message} {hints} onClear={() => (hints = [])} onHintClick={() => (hints = [])} {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} {uploadProps} />
