import { createSignal } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-solid';

const defaultMessages: Message[] = [
    {
        role: 'assistant',
        id: '1',
        createdAt: 1715676751919,
        content: '请求成功',
    },
    {
        id: 'loading',
        role: 'assistant',
        status: 'in_progress', // renders like queued
    },
    {
        role: 'assistant',
        id: 'error',
        content: '请求错误',
        status: 'failed', // renders like cancelled
    },
];

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

    const onChatsChange = (chats: Message[]) => {
        setMessages(chats);
    };

    return <AIChatDialogue chats={messages()} roleConfig={roleConfig} onChatsChange={onChatsChange} />;
}
