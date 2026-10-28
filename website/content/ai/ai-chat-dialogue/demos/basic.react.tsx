import { useState, useCallback } from 'react';
import { AIChatDialogue, type AIChatDialogueMessage as Message, type AIChatDialogueProps } from '@fibrae/semi-ai-react';
import { RadioGroup, Radio, type RadioChangeEvent } from '@fibrae/semi-ui-react';

const defaultMessages: Message[] = [
    {
        role: 'system',
        id: '1',
        createdAt: 1715676751919,
        content: "Hello, I'm your AI assistant.",
    },
    {
        role: 'user',
        id: '2',
        createdAt: 1715676751919,
        content: '给一个 Semi Design 的 Button 组件的使用示例',
    },
    {
        role: 'assistant',
        id: '3',
        createdAt: 1715676751919,
        content: "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@fibrae/semi-ui-react';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
    },
];

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
    const [messages, setMessage] = useState(defaultMessages);
    const [mode, setMode] = useState<NonNullable<AIChatDialogueProps['mode']>>('bubble');
    const [align, setAlign] = useState<NonNullable<AIChatDialogueProps['align']>>('leftRight');

    const onAlignChange = useCallback((e: RadioChangeEvent) => {
        setAlign(e.target.value);
    }, []);

    const onModeChange = useCallback((e: RadioChangeEvent) => {
        setMode(e.target.value);
    }, []);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    return (
        <>
            <span style={{ display: 'flex', flexDirection: 'column', rowGap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    模式
                    <RadioGroup aria-label="模式" onChange={onModeChange} value={mode} type="button">
                        <Radio value="bubble">气泡</Radio>
                        <Radio value="noBubble">非气泡</Radio>
                        <Radio value="userBubble">用户会话气泡</Radio>
                    </RadioGroup>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    会话布局方式
                    <RadioGroup aria-label="会话布局方式" onChange={onAlignChange} value={align} type="button">
                        <Radio value="leftRight">左右分布</Radio>
                        <Radio value="leftAlign">左对齐</Radio>
                    </RadioGroup>
                </span>
            </span>
            <div style={{ border: '1px solid var(--semi-color-border)', borderRadius: 12, marginTop: 10, padding: 20 }}>
                <AIChatDialogue key={align + mode} align={align} mode={mode} chats={messages} roleConfig={roleConfig} onChatsChange={onChatsChange} />
            </div>
        </>
    );
}
