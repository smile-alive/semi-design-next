import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return (
        <Upload
            action="/upload"
            customRequest={mockUpload}
            crop
            onSuccess={(response, file) => {
                console.log('上传成功:', response, file);
            }}
        >
            <Button icon={<IconUpload />} theme="light">
                点击上传（启用裁切）
            </Button>
        </Upload>
    );
}
