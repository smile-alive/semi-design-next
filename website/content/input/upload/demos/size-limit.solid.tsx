import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Toast, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return (
        <Upload action="/upload" customRequest={mockUpload} maxSize={1024} minSize={200} onSizeError={(file) => Toast.error(`${file.name} size invalid`)}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（最小 200KB，最大 1MB）
            </Button>
        </Upload>
    );
}
