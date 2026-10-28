import { useState, useCallback } from 'react';
import { Chat, type ChatMessage as Message, type ChatProps } from '@fibrae/semi-ai-react';
import { Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-react';

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
        content: '给一个 Semi Design 的 Button 组件的使用示例',
    },
    {
        role: 'assistant',
        id: '3',
        createAt: 1715676751919,
        content: "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@fibrae/semi-ui-react';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
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
    margin: '8px 16px',
    height: 550,
};

let id = 0;
function getId() {
    return `id-${id++}`;
}

const uploadProps = { action: 'https://api.semi.design/upload' };
const uploadTipProps = { content: '自定义上传按钮提示信息' };

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);
    const [mode, setMode] = useState<NonNullable<ChatProps['mode']>>('bubble');
    const [align, setAlign] = useState<NonNullable<ChatProps['align']>>('leftRight');

    const onAlignChange = useCallback((e: RadioChangeEvent) => {
        setAlign(e.target.value);
    }, []);

    const onModeChange = useCallback((e: RadioChangeEvent) => {
        setMode(e.target.value);
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
    }, []);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const onMessageReset = useCallback(() => {
        setTimeout(() => {
            setMessage((message) => {
                const lastMessage = message[message.length - 1];
                const newLastMessage: Message = {
                    ...lastMessage,
                    status: 'complete',
                    content: 'This is a mock reset message.',
                };
                return [...message.slice(0, -1), newLastMessage];
            });
        }, 200);
    }, []);

    return (
        <>
            <span style={{ display: 'flex', flexDirection: 'column', rowGap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    模式
                    <RadioGroup onChange={onModeChange} value={mode} type="button">
                        <Radio value="bubble">气泡</Radio>
                        <Radio value="noBubble">非气泡</Radio>
                        <Radio value="userBubble">用户会话气泡</Radio>
                    </RadioGroup>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    会话布局方式
                    <RadioGroup onChange={onAlignChange} value={align} type="button">
                        <Radio value="leftRight">左右分布</Radio>
                        <Radio value="leftAlign">左对齐</Radio>
                    </RadioGroup>
                </span>
            </span>
            <Chat key={align + mode} align={align} mode={mode} uploadProps={uploadProps} style={commonOuterStyle} chats={message} roleConfig={roleInfo} onChatsChange={onChatsChange} onMessageSend={onMessageSend} onMessageReset={onMessageReset} uploadTipProps={uploadTipProps} />
        </>
    );
}
