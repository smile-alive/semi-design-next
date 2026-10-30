import { useState, useCallback } from 'react';
import { Chat, type ChatMessage as Message, type ChatRenderContentProps as RenderContentProps } from '@fibrae/semi-ai-react';
import { IconChevronUp } from '@fibrae/semi-icons-react';
import { MarkdownRender, AvatarGroup, Avatar } from '@fibrae/semi-ui-react';

interface Source {
    avatar: string;
    url: string;
    title: string;
    subTitle: string;
    content: string;
}

const defaultMessage: Message[] = [
    {
        role: 'assistant',
        id: '3',
        createAt: 1715676751919,
        content: 'Semi Design 是由抖音前端团队，MED 产品设计团队设计、开发并维护的设计系统。它作为全面、易用、优质的现代应用 UI 解决方案，从字节跳动各业务线的复杂场景提炼而来，支撑近千计平台产品，服务内外部 10 万+ 用户。',
        source: [
            {
                avatar: '/assets/placeholder/logo.svg',
                url: '/zh-CN/start/introduction',
                title: 'semi Design',
                subTitle: 'Semi design website',
                content: 'Semi Design 是由抖音前端团队，MED 产品设计团队设计、开发并维护的设计系统。',
            },
            {
                avatar: '/assets/placeholder/logo.svg',
                url: '/dsm/landing',
                subTitle: 'Semi DSM website',
                title: 'Semi 设计系统',
                content: '从 Semi Design，到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中',
            },
            {
                avatar: '/assets/placeholder/logo.svg',
                url: '/code/zh-CN/start/introduction',
                subTitle: 'Semi D2C website',
                title: '设计稿转代码',
                content: 'Semi 设计稿转代码（Semi Design to Code，或简称 Semi D2C），是由抖音前端 Semi Design 团队推出的全新的提效工具',
            },
        ],
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
    height: 500,
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

function SourceCard({ source }: { source: Source[] }) {
    const [open, setOpen] = useState(true);
    const onOpen = useCallback(() => {
        setOpen(false);
    }, []);

    const onClose = useCallback(() => {
        setOpen(true);
    }, []);

    return (
        <div
            style={{
                transition: open ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease',
                height: open ? '30px' : '200px',
                width: open ? '190px' : '100%',
                background: 'var(--semi-color-tertiary-light-hover)',
                borderRadius: 16,
                boxSizing: 'border-box',
                marginBottom: 10,
            }}
        >
            <button
                type="button"
                style={{
                    display: !open ? 'none' : 'flex',
                    width: 'fit-content',
                    columnGap: 10,
                    border: 'none',
                    background: 'var(--semi-color-tertiary-light-hover)',
                    borderRadius: '16px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: 'inherit',
                    color: 'var(--semi-color-text-1)',
                }}
                onClick={onOpen}
            >
                <span>基于{source.length}个搜索来源</span>
                <AvatarGroup size="extra-extra-small">
                    {source.map((s, index) => (
                        <Avatar key={index} src={s.avatar} alt="" />
                    ))}
                </AvatarGroup>
            </button>
            <button
                type="button"
                style={{
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: !open ? 'flex' : 'none',
                    flexDirection: 'column',
                    border: 'none',
                    background: 'var(--semi-color-tertiary-light-hover)',
                    borderRadius: '16px',
                    padding: 12,
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    color: 'inherit',
                }}
                onClick={onClose}
            >
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 10px',
                        columnGap: 10,
                        color: 'var(--semi-color-text-1)',
                    }}
                >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>Source</span>
                    <IconChevronUp />
                </span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10, overflow: 'scroll', padding: '5px 10px' }}>
                    {source.map((s) => (
                        <span
                            key={s.url}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                rowGap: 5,
                                flexBasis: 150,
                                flexGrow: 1,
                                border: '1px solid var(--semi-color-border)',
                                borderRadius: 12,
                                padding: 12,
                                fontSize: 12,
                            }}
                        >
                            <span style={{ display: 'flex', columnGap: 5, alignItems: 'center' }}>
                                <Avatar style={{ width: 16, height: 16, flexShrink: 0 }} shape="square" src={s.avatar} alt="" />
                                <span style={{ color: 'var(--semi-color-text-2)', textOverflow: 'ellipsis' }}>{s.title}</span>
                            </span>
                            <span
                                style={{
                                    color: 'var(--semi-color-primary)',
                                    fontSize: 12,
                                }}
                            >
                                {s.subTitle}
                            </span>
                            <span
                                style={{
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: '3',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    color: 'var(--semi-color-text-2)',
                                }}
                            >
                                {s.content}
                            </span>
                        </span>
                    ))}
                </span>
            </button>
        </div>
    );
}

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);

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

    const renderContent = useCallback(({ message, className }: RenderContentProps) => {
        return (
            <div className={className}>
                {message?.source && <SourceCard source={message.source} />}
                <MarkdownRender raw={typeof message?.content === 'string' ? message.content : ''} />
            </div>
        );
    }, []);

    return <Chat style={commonOuterStyle} chats={message} roleConfig={roleInfo} chatBoxRenderConfig={{ renderChatBoxContent: renderContent }} onChatsChange={onChatsChange} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
