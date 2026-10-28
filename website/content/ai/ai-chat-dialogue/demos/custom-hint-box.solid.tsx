import { type JSX, createSignal } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-solid';
import { IconArrowRight } from '@fibrae/semi-icons-solid';

const commonHintStyle: JSX.CSSProperties = {
    border: '1px solid var(--semi-color-border)',
    padding: '10px',
    'border-radius': '10px',
    'background-color': 'transparent',
    color: 'var( --semi-color-text-1)',
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    cursor: 'pointer',
    font: 'inherit',
    'font-size': '14px',
};

const defaultMessages: Message[] = [
    {
        role: 'assistant',
        id: '1',
        createdAt: 1715676751919,
        content: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统，你可以向我提问任何关于 Semi 的问题。',
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

    return (
        <AIChatDialogue
            align="leftRight"
            mode="bubble"
            chats={messages()}
            roleConfig={roleConfig}
            onChatsChange={onChatsChange}
            hints={hints()}
            onHintClick={onHintClick}
            renderHintBox={(props) => (
                <button type="button" style={commonHintStyle} onClick={props.onHintClick}>
                    {props.content}
                    <IconArrowRight style={{ 'margin-left': '10px' }} />
                </button>
            )}
        />
    );
}
