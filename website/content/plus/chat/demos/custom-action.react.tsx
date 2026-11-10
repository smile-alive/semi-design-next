import React, { useState, useCallback } from 'react';
import { Chat, type ChatMessage as Message, type ChatRenderActionProps as RenderActionProps } from '@fibrae/semi-ai-react';
import { IconForward, IconMoreStroked } from '@fibrae/semi-icons-react';
import { Dropdown, Button } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

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
        content: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用',
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
const uploadProps = { action: '/upload', customRequest: mockUpload };

const CustomActions = React.memo(({ defaultActions, className }: RenderActionProps) => {
    return (
        <span className={className}>
            {defaultActions}

            <Dropdown
                key="dropdown"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item icon={<IconForward />}>分享</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
                position="top"
            >
                <Button className="semi-chat-chatBox-action-btn" aria-label="更多" icon={<IconMoreStroked />} theme="borderless" type="tertiary" />
            </Dropdown>
        </span>
    );
});

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);

    const customRenderAction = useCallback((props: RenderActionProps) => {
        return <CustomActions {...props} />;
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

    return (
        <Chat
            chatBoxRenderConfig={{
                renderChatBoxAction: customRenderAction,
            }}
            style={commonOuterStyle}
            chats={message}
            onChatsChange={onChatsChange}
            onMessageSend={onMessageSend}
            roleConfig={roleInfo}
            uploadProps={uploadProps}
        />
    );
}
