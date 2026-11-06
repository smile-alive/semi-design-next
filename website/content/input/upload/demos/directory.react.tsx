import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" directory>
            <Button icon={<IconUpload />} theme="light">
                上传文件夹
            </Button>
        </Upload>
    );
}
