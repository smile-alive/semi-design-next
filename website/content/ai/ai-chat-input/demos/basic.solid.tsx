import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-solid';
import type { UploadOnChangeProps as OnChangeProps } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

const uploadProps = { action: '/upload', customRequest: mockUpload };
const outerStyle = { margin: '12px' };

function onContentChange(content: Content[]) {
    console.log('onContentChange', content);
}

function onUploadChange(fileList: OnChangeProps) {
    console.log('onUploadChange', fileList);
}

export default function AIChatInputDemo() {
    return <AIChatInput placeholder="输入内容或者上传内容..." uploadProps={uploadProps} onContentChange={onContentChange} onUploadChange={onUploadChange} style={outerStyle} />;
}
