import { useState, useCallback } from 'react';
import { AIChatInput, type AIChatInputContent as Content, type AIChatInputReference as Reference } from '@fibrae/semi-ai-react';
import type { UploadOnChangeProps as OnChangeProps, UploadProps } from '@fibrae/semi-ui-react';

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
const outerStyle = { margin: 12 };

const reference: Reference[] = [
    {
        id: '1',
        type: 'text',
        content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
    },
];

export default function AIChatInputDemo() {
    const [references, setReferences] = useState(reference);
    const [generating, setGenerating] = useState(false);
    const onContentChange = useCallback((content: Content[]) => {
        console.log('onContentChange', content);
    }, []);

    const onUploadChange = useCallback((fileList: OnChangeProps) => {
        console.log('onUploadChange', fileList);
    }, []);

    const toggleGenerate = useCallback(() => {
        setGenerating((value) => !value);
    }, []);

    const onMessageSend = useCallback(() => {
        toggleGenerate();
        setReferences([]);
    }, [toggleGenerate]);

    const handleReferenceDelete = useCallback((item: Reference) => {
        setReferences((references) => {
            const newReference = references.filter((ref) => ref.id !== item.id);
            return newReference;
        });
    }, []);

    return (
        <AIChatInput
            defaultContent="点击发送按钮，观察上传内容、引用内容、输入框内容变化"
            generating={generating}
            uploadProps={uploadProps}
            onContentChange={onContentChange}
            onUploadChange={onUploadChange}
            style={outerStyle}
            onMessageSend={onMessageSend}
            onStopGenerate={toggleGenerate}
            onReferenceDelete={handleReferenceDelete}
            references={references}
        />
    );
}
