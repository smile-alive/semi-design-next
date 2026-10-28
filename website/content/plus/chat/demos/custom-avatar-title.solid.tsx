import { createMemo, createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message, type ChatRenderAvatarProps as RenderAvatarProps, type ChatRenderTitleProps as RenderTitleProps } from '@fibrae/semi-ai-solid';
import { Avatar, Radio, RadioGroup } from '@fibrae/semi-ui-solid';

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
    'border-radius': '16px',
    height: '400px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

const formatTime = (createAt?: number) => {
    const date = new Date(createAt ?? Date.now());
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${hours}:${minutes}`;
};

export default function ChatDemo() {
    const [title, setTitle] = createSignal('null');
    const [avatar, setAvatar] = createSignal('null');
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);

    const customRenderAvatar = createMemo(() => {
        if (avatar() === 'custom') {
            return (props: RenderAvatarProps) => (
                <Avatar size="extra-small" shape="square" style={{ 'flex-shrink': '0' }}>
                    {props.role?.name}
                </Avatar>
            );
        }
        if (avatar() === 'null') {
            return () => null;
        }
        return undefined;
    });

    const customRenderTitle = createMemo(() => {
        if (title() === 'custom') {
            return (props: RenderTitleProps) => (
                <span class="title">
                    {props.role?.name}
                    <span class="time">{formatTime(props.message?.createAt)}</span>
                </span>
            );
        }
        if (title() === 'null') {
            return () => null;
        }
        return undefined;
    });

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

    return (
        <>
            <span style={{ display: 'flex', 'flex-direction': 'column', 'row-gap': '8px', 'margin-bottom': '5px' }}>
                <span style={{ display: 'flex', 'align-items': 'center', 'column-gap': '10px' }}>
                    头像渲染模式
                    <RadioGroup onChange={(e) => setAvatar(e.target.value)} value={avatar()} type="button">
                        <Radio value="default">默认头像</Radio>
                        <Radio value="null">无头像</Radio>
                        <Radio value="custom">自定义头像</Radio>
                    </RadioGroup>
                </span>
                <span style={{ display: 'flex', 'align-items': 'center', 'column-gap': '10px' }}>
                    标题渲染模式
                    <RadioGroup onChange={(e) => setTitle(e.target.value)} value={title()} type="button">
                        <Radio value="default">默认标题</Radio>
                        <Radio value="null">无标题</Radio>
                        <Radio value="custom">自定义标题</Radio>
                    </RadioGroup>
                </span>
            </span>
            <Chat
                chatBoxRenderConfig={{
                    renderChatBoxTitle: customRenderTitle(),
                    renderChatBoxAvatar: customRenderAvatar(),
                }}
                style={commonOuterStyle}
                class="component-chat-demo-custom-render"
                chats={chats()}
                onChatsChange={(next) => setChats(next)}
                onMessageSend={onMessageSend}
                roleConfig={roleInfo}
                uploadProps={uploadProps}
            />
        </>
    );
}
