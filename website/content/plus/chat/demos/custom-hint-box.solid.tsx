import { type JSX, createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message, type ChatRenderHintBoxProps as RenderHintBoxProps } from '@fibrae/semi-ai-solid';
import { IconArrowRight } from '@fibrae/semi-icons-solid';

const defaultMessage: Message[] = [
    {
        role: 'assistant',
        id: '1',
        createAt: 1715676751919,
        content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
    },
];

const hintsExample = ['告诉我更多', 'Semi Design 的组件有哪些？', '我能够通过 DSM 定制自己的主题吗？'];

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

const commonHintStyle: JSX.CSSProperties = {
    border: '1px solid var(--semi-color-border)',
    padding: '10px',
    'border-radius': '10px',
    background: 'none',
    color: 'var( --semi-color-text-1)',
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    'text-align': 'left',
    cursor: 'pointer',
    'font-family': 'inherit',
    'font-size': '14px',
    'line-height': 'inherit',
};

const renderHintBox = (props: RenderHintBoxProps) => (
    <button type="button" style={commonHintStyle} onClick={() => props.onHintClick()}>
        {props.content}
        <IconArrowRight style={{ 'margin-left': '10px' }} />
    </button>
);

export default function ChatDemo() {
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);
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
            setChats((list) => [...list, newAssistantMessage]);
        }, 200);
        setHints([]);
    };

    return <Chat renderHintBox={renderHintBox} hints={hints()} onHintClick={onHintClick} style={commonOuterStyle} chats={chats()} roleConfig={roleInfo} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} onClear={() => setHints([])} uploadProps={uploadProps} />;
}
