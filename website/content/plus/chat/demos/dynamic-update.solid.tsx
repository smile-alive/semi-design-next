import { createSignal, onCleanup, onMount } from 'solid-js';
import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-solid';

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
        content: '介绍一下 Semi design',
    },
    {
        role: 'assistant',
        id: '3',
        createAt: 1715676751919,
        content: `
Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户[[1]](https://semi.design/zh-CN/start/introduction)。

Semi Design的特点包括：

1. 设计简洁、现代化。
2. 提供主题方案，可深度样式定制。
3. 提供明暗色两套模式，切换方便。
4. 国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
5. 采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。

---
Learn more:
1. [Introduction 介绍 - Semi Design](https://semi.design/zh-CN/start/introduction)
2. [Getting Started 快速开始 - Semi Design](https://semi.design/zh-CN/start/getting-started)
3. [Semi D2C 设计稿转代码的演进之路 - 知乎](https://zhuanlan.zhihu.com/p/667189184)
`,
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
    height: '600px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

export default function ChatDemo() {
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);
    // the interval outlives the send that started it, so it is cleared when the demo unmounts too
    let intervalId: number | undefined;
    // registered on mount: a server render disposes without mounting and has no window
    onMount(() => onCleanup(() => window.clearInterval(intervalId)));

    const generateMockResponse = (content: string) => {
        const id = window.setInterval(() => {
            setChats((list) => {
                const lastMessage = list[list.length - 1];
                let newMessage: Message = { ...lastMessage };
                if (lastMessage.status === 'loading') {
                    newMessage = {
                        ...newMessage,
                        content: `mock Response for ${content} \n`,
                        status: 'incomplete',
                    };
                } else if (lastMessage.status === 'incomplete') {
                    if ((lastMessage.content?.length ?? 0) > 200) {
                        window.clearInterval(id);
                        intervalId = undefined;
                        newMessage = {
                            ...newMessage,
                            content: `${lastMessage.content} mock stream message`,
                            status: 'complete',
                        };
                    } else {
                        newMessage = {
                            ...newMessage,
                            content: `${lastMessage.content} mock stream message`,
                        };
                    }
                }
                return [...list.slice(0, -1), newMessage];
            });
        }, 400);
        intervalId = id;
    };

    const onMessageSend = (content: string) => {
        setChats((list) => [
            ...list,
            {
                role: 'assistant',
                status: 'loading',
                createAt: Date.now(),
                id: getId(),
            },
        ]);
        generateMockResponse(content);
    };

    const onStopGenerator = () => {
        if (intervalId) {
            window.clearInterval(intervalId);
            setChats((list) => {
                const lastMessage = list[list.length - 1];
                if (lastMessage.status && lastMessage.status !== 'complete') {
                    return [...list.slice(0, -1), { ...lastMessage, status: 'complete' }];
                }
                return list;
            });
        }
    };

    return <Chat chats={chats()} showStopGenerate style={commonOuterStyle} onStopGenerator={onStopGenerator} roleConfig={roleInfo} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
