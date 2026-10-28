import { useState, useCallback } from 'react';
import { AIChatInput, type AIChatInputReference as Reference } from '@fibrae/semi-ai-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };
const referenceTemp = [
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
        name: '飞书文档.pdf',
    },
    {
        id: '4',
        name: 'Music.mp4',
    },
    {
        id: '5',
        name: 'Image.jpeg',
        url: '/assets/placeholder/avatar-b.svg',
    },
    {
        id: '6',
        name: 'code.json',
    },
];

export default function AIChatInputDemo() {
    const [references, setReferences] = useState(referenceTemp);
    const handleReferenceDelete = useCallback(
        (item: Reference) => {
            const newReference = references.filter((ref) => ref.id !== item.id);
            setReferences(newReference);
        },
        [references]
    );

    const handleReferenceClick = useCallback((item: Reference) => {
        console.log('点击了引用', item);
    }, []);

    return <AIChatInput placeholder="用于查看引用内容的用例" onReferenceDelete={handleReferenceDelete} onReferenceClick={handleReferenceClick} references={references} uploadProps={uploadProps} style={outerStyle} />;
}
