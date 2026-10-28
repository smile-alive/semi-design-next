import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return (
        <Upload
            action="https://api.semi.design/upload"
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
