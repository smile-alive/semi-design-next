import { useState, useCallback } from 'react';
import { AIChatDialogue, type AIChatDialogueMessage as Message, type DialogueRenderConfig } from '@fibrae/semi-ai-react';
import { Avatar } from '@fibrae/semi-ui-react';

export default function AIChatDialogueDemo() {
    const defaultMessages = [
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

    const [messages, setMessage] = useState<Message[]>(defaultMessages);
    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const renderConfig: DialogueRenderConfig = {
        renderDialogueTitle: (props) => {
            return <div className="semi-ai-chat-dialogue-title">My-{props.role?.name}</div>;
        },
        renderDialogueAvatar: (props) => {
            return <Avatar src={props.role?.avatar} alt="" size="extra-small" shape="square" />;
        },
        renderDialogueAction: (props) => {
            return <div className={props.className}>{Array.isArray(props.defaultActions) && props.defaultActions[0]}</div>;
        },
    };

    return <AIChatDialogue align="leftRight" mode="bubble" chats={messages} roleConfig={roleConfig} onChatsChange={onChatsChange} dialogueRenderConfig={renderConfig} />;
}
