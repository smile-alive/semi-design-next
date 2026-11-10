import { createSignal } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-solid';

const defaultMessages: Message[] = [
    {
        role: 'assistant',
        id: '1',
        createdAt: 1715676751919,
        content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用，你可以向我提问任何关于 Semi 的问题。',
    },
];

const hintsExample = ['Semi 组件库有哪些常用组件？', '能否展示一个使用 Semi 组件库构建的页面示例？', 'Semi 组件库有官方文档吗？'];

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

export default function AIChatDialogueDemo() {
    const [messages, setMessages] = createSignal(defaultMessages);
    const [hints, setHints] = createSignal(hintsExample);

    const onChatsChange = (chats: Message[]) => {
        setMessages(chats);
    };

    const onHintClick = () => {
        setHints([]);
    };

    return <AIChatDialogue align="leftRight" mode="bubble" chats={messages()} roleConfig={roleConfig} onChatsChange={onChatsChange} hints={hints()} onHintClick={onHintClick} />;
}
