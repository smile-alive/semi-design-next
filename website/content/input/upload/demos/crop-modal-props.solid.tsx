import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return (
        <Upload
            action="/upload"
            customRequest={mockUpload}
            crop={{
                aspectRatio: 1,
                shape: 'rect',
            }}
            cropModalProps={{
                width: 800,
                style: { height: '600px' },
                styles: { body: { height: '500px', 'background-color': '#f5f5f5' } },
            }}
            onSuccess={(response, file) => {
                console.log('上传成功:', response, file);
            }}
        >
            <Button icon={<IconUpload />} theme="light">
                自定义弹窗样式
            </Button>
        </Upload>
    );
}
