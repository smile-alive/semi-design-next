import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Toast, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" maxSize={1024} minSize={200} onSizeError={(file) => Toast.error(`${file.name} size invalid`)}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（最小 200KB，最大 1MB）
            </Button>
        </Upload>
    );
}
