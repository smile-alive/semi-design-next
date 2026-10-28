import { createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-solid';

const defaultMessage: Message[] = [
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
    margin: '8px 16px',
    height: '550px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}

const uploadProps = { action: 'https://api.semi.design/upload' };
const uploadTipProps = { content: '自定义上传按钮提示信息' };

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

    const onMessageReset = () => {
        setTimeout(() => {
            setChats((list) => {
                const lastMessage = list[list.length - 1];
                const newLastMessage: Message = {
                    ...lastMessage,
                    status: 'complete',
                    content: 'This is a mock reset message.',
                };
                return [...list.slice(0, -1), newLastMessage];
            });
        }, 200);
    };

    return <Chat uploadProps={uploadProps} style={commonOuterStyle} chats={chats()} roleConfig={roleInfo} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} onMessageReset={onMessageReset} uploadTipProps={uploadTipProps} showClearContext />;
}
