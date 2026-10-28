import { createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-solid';

const defaultMessage: Message[] = [
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
];

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

const commonOuterStyle = {
    border: '1px solid var(--semi-color-border)',
    'border-radius': '16px',
    height: '400px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

export default function ChatDemo() {
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            setChats((list) => [...list, newAssistantMessage]);
        }, 200);
    };

    return <Chat style={commonOuterStyle} chats={chats()} roleConfig={roleInfo} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
