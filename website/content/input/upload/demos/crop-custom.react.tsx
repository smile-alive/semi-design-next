import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    return (
        <Upload
            action="https://api.semi.design/upload"
            crop={{
                aspectRatio: 16 / 9,
                shape: 'rect',
                quality: 0.8,
                modalTitle: '裁切图片',
                modalOkText: '确认裁切',
                modalCancelText: '取消',
            }}
            onSuccess={(response, file) => {
                console.log('上传成功:', response, file);
            }}
        >
            <Button icon={<IconUpload />} theme="light">
                点击上传（16:9 裁切）
            </Button>
        </Upload>
    );
}
