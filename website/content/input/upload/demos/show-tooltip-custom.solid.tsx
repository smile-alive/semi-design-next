import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Tooltip, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return (
        <Upload
            action="https://api.semi.design/upload"
            showTooltip={{
                renderTooltip: (content, children) => (
                    <Tooltip content={content} position="bottom">
                        {children}
                    </Tooltip>
                ),
            }}
        >
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
