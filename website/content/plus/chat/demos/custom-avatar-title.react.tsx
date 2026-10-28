import { useState, useCallback, useMemo } from 'react';
import { Chat, type ChatMessage as Message, type ChatRenderAvatarProps as RenderAvatarProps, type ChatRenderTitleProps as RenderTitleProps } from '@fibrae/semi-ai-react';
import { Avatar, Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-react';

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
        content: [
            {
                type: 'text',
                text: '这张图片里有什么？',
            },
            {
                type: 'image_url',
                image_url: {
                    url: '/assets/root-web-sites/edit-bag.jpeg',
                },
            },
        ],
    },
    {
        role: 'assistant',
        id: '3',
        createAt: 1715676751919,
        content: '图片中是一个有卡通画像装饰的黄色背包。',
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
    const [title, setTitle] = useState('null');
    const [avatar, setAvatar] = useState('null');
    const [message, setMessage] = useState(defaultMessage);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const customRenderAvatar = useMemo(() => {
        switch (avatar) {
            case 'custom':
                return ({ role }: RenderAvatarProps) => {
                    return (
                        <Avatar size="extra-small" shape="square" style={{ flexShrink: '0' }}>
                            {role?.name}
                        </Avatar>
                    );
                };
            case 'null':
                return () => null;
            case 'default':
                return undefined;
        }
    }, [avatar]);

    const customRenderTitle = useMemo(() => {
        switch (title) {
            case 'custom':
                return ({ role, message }: RenderTitleProps) => {
                    const date = new Date(message?.createAt ?? Date.now());
                    const hours = ('0' + date.getHours()).slice(-2);
                    const minutes = ('0' + date.getMinutes()).slice(-2);
                    const formatTime = `${hours}:${minutes}`;
                    return (
                        <span className="title">
                            {role?.name}
                            <span className="time">{formatTime}</span>
                        </span>
                    );
                };
            case 'null':
                return () => null;
            case 'default':
                return undefined;
        }
    }, [title]);

    const onAvatarChange = useCallback((e: RadioChangeEvent) => {
        setAvatar(e.target.value);
    }, []);
    const onTitleChange = useCallback((e: RadioChangeEvent) => {
        setTitle(e.target.value);
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
        <>
            <span style={{ display: 'flex', flexDirection: 'column', rowGap: 8, marginBottom: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: 10 }}>
                    头像渲染模式
                    <RadioGroup onChange={onAvatarChange} value={avatar} type="button">
                        <Radio value="default">默认头像</Radio>
                        <Radio value="null">无头像</Radio>
                        <Radio value="custom">自定义头像</Radio>
                    </RadioGroup>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: 10 }}>
                    标题渲染模式
                    <RadioGroup onChange={onTitleChange} value={title} type="button">
                        <Radio value="default">默认标题</Radio>
                        <Radio value="null">无标题</Radio>
                        <Radio value="custom">自定义标题</Radio>
                    </RadioGroup>
                </span>
            </span>
            <Chat
                chatBoxRenderConfig={{
                    renderChatBoxTitle: customRenderTitle,
                    renderChatBoxAvatar: customRenderAvatar,
                }}
                key={`${avatar}${title}`}
                style={commonOuterStyle}
                className="component-chat-demo-custom-render"
                chats={message}
                onChatsChange={onChatsChange}
                onMessageSend={onMessageSend}
                roleConfig={roleInfo}
                uploadProps={uploadProps}
            />
        </>
    );
}
