import { Show, createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message, type ChatRenderFullChatBoxProps as RenderFullChatBoxProps } from '@fibrae/semi-ai-solid';
import { Avatar } from '@fibrae/semi-ui-solid';

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
    height: '400px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

const titleStyle = {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'column-gap': '10px',
    padding: '5px 0px',
    width: 'fit-content',
};

const renderFullChatBox = (props: RenderFullChatBoxProps) => (
    <div class={props.class}>
        <div
            style={{
                display: 'flex',
                'flex-direction': 'column',
                'row-gap': '4px',
                'align-items': props.message?.role === 'user' ? 'end' : '',
            }}
        >
            <Show when={props.message?.role !== 'user'}>
                <span style={titleStyle}>
                    <Avatar size="extra-small" shape="square" src={typeof props.role?.avatar === 'string' ? props.role.avatar : undefined} alt="" />
                    {props.defaultNodes?.title?.()}
                </span>
            </Show>
            <div style={{ width: 'fit-content' }}>{props.defaultNodes?.content?.()}</div>
            {props.defaultNodes?.action?.()}
        </div>
    </div>
);

export default function ChatDemo() {
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            content: `This is a mock response`,
        };
        setTimeout(() => {
            setChats((list) => [...list, newAssistantMessage]);
        }, 200);
    };

    return <Chat chatBoxRenderConfig={{ renderFullChatBox }} style={commonOuterStyle} chats={chats()} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} roleConfig={roleInfo} uploadProps={uploadProps} />;
}
