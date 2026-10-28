import { createSignal } from 'solid-js';
import { AIChatInput, type AIChatInputReference as Reference } from '@fibrae/semi-ai-solid';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };
const referenceTemp: Reference[] = [
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

const handleReferenceClick = (item: Reference) => {
    console.log('点击了引用', item);
};

export default function AIChatInputDemo() {
    const [references, setReferences] = createSignal(referenceTemp);

    const handleReferenceDelete = (item: Reference) => {
        setReferences((list) => list.filter((ref) => ref.id !== item.id));
    };

    return <AIChatInput placeholder="用于查看引用内容的用例" onReferenceDelete={handleReferenceDelete} onReferenceClick={handleReferenceClick} references={references()} uploadProps={uploadProps} style={outerStyle} />;
}
