import { useState, useCallback } from 'react';
import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-react';

const defaultMessages = [
    {
        id: '1',
        role: 'user',
        content: '当前消息为引用 demo 的示例',
        references: [
            {
                id: '1',
                type: 'text',
                content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
            },
            {
                id: '2',
                name: '飞书文档.docx',
            },
            {
                id: '3',
                name: 'Music.mp4',
            },
            {
                id: '4',
                name: 'Image.jpeg',
                url: '/assets/placeholder/avatar-b.svg',
            },
            {
                id: '5',
                name: 'code.json',
            },
        ],
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
    const [messages, setMessage] = useState<Message[]>(defaultMessages);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const onReferenceClick = () => {
        console.log('You click the reference button!');
    };

    return <AIChatDialogue chats={messages} roleConfig={roleConfig} onChatsChange={onChatsChange} showReference onReferenceClick={onReferenceClick} />;
}
