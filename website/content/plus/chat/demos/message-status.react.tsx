import { useState, useCallback } from 'react';
import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-react';

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
    borderRadius: '16px',
    height: 400,
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);

    const onMessageSend = useCallback(() => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            setMessage((message) => [...message, newAssistantMessage]);
        }, 200);
    }, []);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    return <Chat style={commonOuterStyle} chats={message} roleConfig={roleInfo} onChatsChange={onChatsChange} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
