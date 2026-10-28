import { useState, useCallback } from 'react';
import { Chat, type ChatMessage as Message, type ChatRenderFullChatBoxProps as RenderFullChatBoxProps } from '@fibrae/semi-ai-react';
import { Avatar } from '@fibrae/semi-ui-react';

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
    borderRadius: '16px',
    height: 400,
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: '10px',
    padding: '5px 0px',
    width: 'fit-content',
};

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);

    const customRenderChatBox = useCallback(({ role, message, defaultNodes, className }: RenderFullChatBoxProps) => {
        let titleNode = null;
        if (message?.role !== 'user') {
            titleNode = (
                <span style={titleStyle}>
                    <Avatar size="extra-small" shape="square" src={typeof role?.avatar === 'string' ? role.avatar : undefined} alt="" />
                    {defaultNodes?.title}
                </span>
            );
        }
        return (
            <div className={className}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        rowGap: 4,
                        alignItems: message?.role === 'user' ? 'end' : '',
                    }}
                >
                    {titleNode}
                    <div style={{ width: 'fit-content' }}>{defaultNodes?.content}</div>
                    {defaultNodes?.action}
                </div>
            </div>
        );
    }, []);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const onMessageSend = useCallback(() => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            content: `This is a mock response`,
        };
        setTimeout(() => {
            setMessage((message) => [...message, newAssistantMessage]);
        }, 200);
    }, []);

    return <Chat chatBoxRenderConfig={{ renderFullChatBox: customRenderChatBox }} style={commonOuterStyle} chats={message} onChatsChange={onChatsChange} onMessageSend={onMessageSend} roleConfig={roleInfo} uploadProps={uploadProps} />;
}
