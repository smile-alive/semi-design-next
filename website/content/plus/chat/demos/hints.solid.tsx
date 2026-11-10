import { createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-solid';
import { mockUpload } from '#/lib/mock-upload';

const defaultMessage: Message[] = [
    {
        role: 'assistant',
        id: '1',
        createAt: 1715676751919,
        content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用，你可以向我提问任何关于 Semi 的问题。',
    },
];

const hintsExample = ['告诉我更多', 'Semi Design 的组件有哪些？', '我能够自定义主题吗？'];

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
const uploadProps = { action: '/upload', customRequest: mockUpload };

export default function ChatDemo() {
    const [message, setMessage] = createSignal<Message[]>(defaultMessage);
    const [hints, setHints] = createSignal(hintsExample);

    const onHintClick = () => {
        setHints([]);
    };

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            createAt: Date.now(),
            content: '这是一条 mock 回复信息',
        };
        setTimeout(() => {
            setMessage((list) => [...list, newAssistantMessage]);
        }, 200);
    };

    return <Chat hints={hints()} onHintClick={onHintClick} style={commonOuterStyle} chats={message()} roleConfig={roleInfo} onChatsChange={(next) => setMessage(next)} onMessageSend={onMessageSend} onClear={() => setHints([])} uploadProps={uploadProps} />;
}
