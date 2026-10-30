import { For, Show, createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message, type ChatRenderContentProps as RenderContentProps } from '@fibrae/semi-ai-solid';
import { IconChevronUp } from '@fibrae/semi-icons-solid';
import { Avatar, AvatarGroup, MarkdownRender } from '@fibrae/semi-ui-solid';

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
    'border-radius': '16px',
    height: '500px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

function SourceCard(props: { source: Source[] }) {
    const [open, setOpen] = createSignal(true);

    return (
        <div
            style={{
                transition: open() ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease',
                height: open() ? '30px' : '200px',
                width: open() ? '190px' : '100%',
                background: 'var(--semi-color-tertiary-light-hover)',
                'border-radius': '16px',
                'box-sizing': 'border-box',
                'margin-bottom': '10px',
            }}
        >
            <button
                type="button"
                style={{
                    display: open() ? 'flex' : 'none',
                    width: 'fit-content',
                    'column-gap': '10px',
                    border: 'none',
                    background: 'var(--semi-color-tertiary-light-hover)',
                    'border-radius': '16px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    'font-family': 'inherit',
                    'font-size': '14px',
                    'line-height': 'inherit',
                    color: 'var(--semi-color-text-1)',
                }}
                onClick={() => setOpen(false)}
            >
                <span>基于{props.source.length}个搜索来源</span>
                <AvatarGroup size="extra-extra-small">
                    <For each={props.source}>{(source) => <Avatar src={source.avatar} alt="" />}</For>
                </AvatarGroup>
            </button>
            <button
                type="button"
                style={{
                    width: '100%',
                    height: '100%',
                    'box-sizing': 'border-box',
                    display: open() ? 'none' : 'flex',
                    'flex-direction': 'column',
                    border: 'none',
                    background: 'var(--semi-color-tertiary-light-hover)',
                    'border-radius': '16px',
                    padding: '12px',
                    'text-align': 'left',
                    'font-family': 'inherit',
                    'font-size': 'inherit',
                    'line-height': 'inherit',
                    color: 'inherit',
                }}
                onClick={() => setOpen(true)}
            >
                <span
                    style={{
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'space-between',
                        padding: '5px 10px',
                        'column-gap': '10px',
                        color: 'var(--semi-color-text-1)',
                    }}
                >
                    <span style={{ 'font-size': '14px', 'font-weight': '500' }}>Source</span>
                    <IconChevronUp />
                </span>
                <span style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '10px', overflow: 'scroll', padding: '5px 10px' }}>
                    <For each={props.source}>
                        {(source) => (
                            <span
                                style={{
                                    display: 'flex',
                                    'flex-direction': 'column',
                                    'row-gap': '5px',
                                    'flex-basis': '150px',
                                    'flex-grow': '1',
                                    border: '1px solid var(--semi-color-border)',
                                    'border-radius': '12px',
                                    padding: '12px',
                                    'font-size': '12px',
                                }}
                            >
                                <span style={{ display: 'flex', 'column-gap': '5px', 'align-items': 'center' }}>
                                    <Avatar style={{ width: '16px', height: '16px', 'flex-shrink': '0' }} shape="square" src={source.avatar} alt="" />
                                    <span style={{ color: 'var(--semi-color-text-2)', 'text-overflow': 'ellipsis' }}>{source.title}</span>
                                </span>
                                <span
                                    style={{
                                        color: 'var(--semi-color-primary)',
                                        'font-size': '12px',
                                    }}
                                >
                                    {source.subTitle}
                                </span>
                                <span
                                    style={{
                                        display: '-webkit-box',
                                        '-webkit-box-orient': 'vertical',
                                        '-webkit-line-clamp': '3',
                                        'text-overflow': 'ellipsis',
                                        overflow: 'hidden',
                                        color: 'var(--semi-color-text-2)',
                                    }}
                                >
                                    {source.content}
                                </span>
                            </span>
                        )}
                    </For>
                </span>
            </button>
        </div>
    );
}

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

    const renderChatBoxContent = (props: RenderContentProps) => (
        <div class={props.class}>
            <Show when={props.message?.source} keyed>
                {(source) => <SourceCard source={source} />}
            </Show>
            <MarkdownRender raw={typeof props.message?.content === 'string' ? props.message.content : ''} />
        </div>
    );

    return <Chat style={commonOuterStyle} chats={chats()} roleConfig={roleInfo} chatBoxRenderConfig={{ renderChatBoxContent }} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
