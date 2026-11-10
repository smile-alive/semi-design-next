import { useCallback } from 'react';
import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-react';
import type { UploadOnChangeProps as OnChangeProps } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const uploadProps = { action: '/upload', customRequest: mockUpload };
const outerStyle = { margin: 12 };

export default function AIChatInputDemo() {
    const onContentChange = useCallback((content: Content[]) => {
        console.log('onContentChange', content);
    }, []);

    const onUploadChange = useCallback((fileList: OnChangeProps) => {
        console.log('onUploadChange', fileList);
    }, []);

    return <AIChatInput placeholder="输入内容或者上传内容..." uploadProps={uploadProps} onContentChange={onContentChange} onUploadChange={onUploadChange} style={outerStyle} />;
}
