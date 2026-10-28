import { AIChatInput } from '@fibrae/semi-ai-react';
import { IconUpload } from '@fibrae/semi-icons-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };

export default function AIChatInputDemo() {
    return (
        <AIChatInput
            placeholder="自定义上传按钮（仍支持粘贴上传）"
            uploadProps={uploadProps}
            renderUploadButton={({ openFileDialog, disabled }) => (
                <button
                    type="button"
                    aria-label="上传"
                    disabled={disabled}
                    className="semi-button semi-button-borderless"
                    onClick={(e) => {
                        e.stopPropagation();
                        openFileDialog();
                    }}
                >
                    <IconUpload />
                </button>
            )}
            style={outerStyle}
        />
    );
}
