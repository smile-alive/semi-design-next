import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type UploadCustomRequestArgs, Upload } from '@fibrae/semi-ui-solid';

function mockRequest({ onProgress, onSuccess }: UploadCustomRequestArgs) {
    let count = 0;
    const interval = setInterval(() => {
        if (count === 100) {
            clearInterval(interval);
            onSuccess({});
            return;
        }
        onProgress({ total: 100, loaded: count });
        count += 20;
    }, 500);
}

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" customRequest={mockRequest}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
