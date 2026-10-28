import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type UploadCustomRequestArgs } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const mockRequest = ({ onProgress, onSuccess }: UploadCustomRequestArgs) => {
        let count = 0;
        let interval = setInterval(() => {
            if (count === 100) {
                clearInterval(interval);
                onSuccess({});
                return;
            }
            onProgress({ total: 100, loaded: count });
            count += 20;
        }, 500);
    };

    return (
        <Upload action="https://api.semi.design/upload" customRequest={mockRequest}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
