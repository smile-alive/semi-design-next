import { AIChatInput, type RenderUploadButtonProps } from '@fibrae/semi-ai-solid';
import { IconUpload } from '@fibrae/semi-icons-solid';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };

const renderUploadButton = (props: RenderUploadButtonProps) => (
    <button
        type="button"
        aria-label="上传"
        disabled={props.disabled}
        class="semi-button semi-button-borderless"
        onClick={(e) => {
            e.stopPropagation();
            props.openFileDialog();
        }}
    >
        <IconUpload />
    </button>
);

export default function AIChatInputDemo() {
    return <AIChatInput placeholder="自定义上传按钮（仍支持粘贴上传）" uploadProps={uploadProps} renderUploadButton={renderUploadButton} style={outerStyle} />;
}
