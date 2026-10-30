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
            content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
        },
    ]);
    let hints = $state(['告诉我更多', 'Semi Design 的组件有哪些？', '我能够通过 DSM 定制自己的主题吗？']);

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

<Chat bind:chats={messages} {hints} onClear={() => (hints = [])} onHintClick={() => (hints = [])} {onMessageSend} {roleConfig} style="border: 1px solid var(--semi-color-border); border-radius: 16px; height: 400px" {uploadProps} />
