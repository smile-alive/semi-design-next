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
            draggable
            onDrop={(_e, files) => {
                console.log('拖拽文件:', files);
            }}
            onSuccess={(response, file) => {
                console.log('上传成功:', response, file);
            }}
        >
            <Button icon={<IconUpload />} theme="light">
                拖拽上传（启用裁切）
            </Button>
        </Upload>
    );
}
