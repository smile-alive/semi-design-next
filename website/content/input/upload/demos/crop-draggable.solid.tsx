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
