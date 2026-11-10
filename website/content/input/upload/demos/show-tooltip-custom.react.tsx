import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, Tooltip } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return (
        <Upload
            action="/upload"
            customRequest={mockUpload}
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
