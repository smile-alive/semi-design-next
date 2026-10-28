import { createSignal } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueMessage as Message, type AIChatDialogueProps } from '@fibrae/semi-ai-solid';
import { Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

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

const containerStyle = { display: 'flex', 'flex-direction': 'column', 'row-gap': '8px' } as const;
const rowStyle = { display: 'flex', 'align-items': 'center', 'column-gap': '10px' } as const;
const panelStyle = { border: '1px solid var(--semi-color-border)', 'border-radius': '12px', 'margin-top': '10px', padding: '20px' } as const;

export default function AIChatDialogueDemo() {
    const [messages, setMessages] = createSignal(defaultMessages);
    const [mode, setMode] = createSignal<NonNullable<AIChatDialogueProps['mode']>>('bubble');
    const [align, setAlign] = createSignal<NonNullable<AIChatDialogueProps['align']>>('leftRight');

    const onAlignChange = (e: RadioChangeEvent) => {
        setAlign(e.target.value);
    };

    const onModeChange = (e: RadioChangeEvent) => {
        setMode(e.target.value);
    };

    const onChatsChange = (chats: Message[]) => {
        setMessages(chats);
    };

    return (
        <>
            <span style={containerStyle}>
                <span style={rowStyle}>
                    模式
                    <RadioGroup aria-label="模式" onChange={onModeChange} value={mode()} type="button">
                        <Radio value="bubble">气泡</Radio>
                        <Radio value="noBubble">非气泡</Radio>
                        <Radio value="userBubble">用户会话气泡</Radio>
                    </RadioGroup>
                </span>
                <span style={rowStyle}>
                    会话布局方式
                    <RadioGroup aria-label="会话布局方式" onChange={onAlignChange} value={align()} type="button">
                        <Radio value="leftRight">左右分布</Radio>
                        <Radio value="leftAlign">左对齐</Radio>
                    </RadioGroup>
                </span>
            </span>
            <div style={panelStyle}>
                <AIChatDialogue align={align()} mode={mode()} chats={messages()} roleConfig={roleConfig} onChatsChange={onChatsChange} />
            </div>
        </>
    );
}
