import { createSignal } from 'solid-js';
import { AIChatInput, type AIChatInputContent as Content, type AIChatInputReference as Reference } from '@fibrae/semi-ai-solid';
import type { UploadOnChangeProps as OnChangeProps, UploadProps } from '@fibrae/semi-ui-solid';

const uploadProps: UploadProps = {
    action: 'https://api.semi.design/upload',
    defaultFileList: [
        {
            uid: '1',
            name: 'dy.jpeg',
            status: 'success',
            size: '130kb',
            url: '/assets/placeholder/avatar-a.svg',
        },
        {
            uid: '5',
            name: 'resso.jpeg',
            status: 'uploading',
            percent: 50,
            size: '222kb',
            url: '/assets/placeholder/avatar-b.svg',
        },
    ],
};
const outerStyle = { margin: '12px' };

const reference: Reference[] = [
    {
        id: '1',
        type: 'text',
        content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
    },
];

function onContentChange(content: Content[]) {
    console.log('onContentChange', content);
}

function onUploadChange(fileList: OnChangeProps) {
    console.log('onUploadChange', fileList);
}

export default function AIChatInputDemo() {
    const [references, setReferences] = createSignal(reference);
    const [generating, setGenerating] = createSignal(false);

    const toggleGenerate = () => {
        setGenerating((value) => !value);
    };

    const onMessageSend = () => {
        toggleGenerate();
        setReferences([]);
    };

    const handleReferenceDelete = (item: Reference) => {
        setReferences((list) => list.filter((ref) => ref.id !== item.id));
    };

    return (
        <AIChatInput
            defaultContent="点击发送按钮，观察上传内容、引用内容、输入框内容变化"
            generating={generating()}
            uploadProps={uploadProps}
            onContentChange={onContentChange}
            onUploadChange={onUploadChange}
            style={outerStyle}
            onMessageSend={onMessageSend}
            onStopGenerate={toggleGenerate}
            onReferenceDelete={handleReferenceDelete}
            references={references()}
        />
    );
}
