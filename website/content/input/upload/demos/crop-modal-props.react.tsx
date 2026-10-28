import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    return (
        <Upload
            action="https://api.semi.design/upload"
            crop={{
                aspectRatio: 1,
                shape: 'rect',
            }}
            cropModalProps={{
                width: 800,
                style: { height: 600 },
                bodyStyle: { height: 500, backgroundColor: '#f5f5f5' },
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
