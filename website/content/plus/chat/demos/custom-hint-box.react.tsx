import { useState, useCallback, type CSSProperties } from 'react';
import { Chat, type ChatMessage as Message, type ChatProps } from '@fibrae/semi-ai-react';
import { IconArrowRight } from '@fibrae/semi-icons-react';
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
    borderRadius: '16px',
    height: 400,
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: '/upload', customRequest: mockUpload };

const commonHintStyle: CSSProperties = {
    border: '1px solid var(--semi-color-border)',
    padding: '10px',
    borderRadius: '10px',
    background: 'none',
    color: 'var(--semi-color-text-1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 'inherit',
};

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);
    const [hints, setHints] = useState(hintsExample);

    const onHintClick = useCallback(() => {
        setHints([]);
    }, []);

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
        setHints([]);
    }, []);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const renderHintBox = useCallback<NonNullable<ChatProps['renderHintBox']>>((props) => {
        return (
            <button type="button" style={commonHintStyle} onClick={props.onHintClick} key={props.index}>
                {props.content}
                <IconArrowRight style={{ marginInlineStart: 10 }} />
            </button>
        );
    }, []);

    const onClear = useCallback(() => {
        setHints([]);
    }, []);

    return <Chat renderHintBox={renderHintBox} hints={hints} onHintClick={onHintClick} style={commonOuterStyle} chats={message} roleConfig={roleInfo} onChatsChange={onChatsChange} onMessageSend={onMessageSend} onClear={onClear} uploadProps={uploadProps} />;
}
